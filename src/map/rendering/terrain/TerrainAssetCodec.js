const MAGIC = new Uint8Array([0x48, 0x54, 0x52, 0x4e]);
export const TERRAIN_BINARY_VERSION = 1;

export function encodeTerrainTile({ size, heights, normals, splatRgba, splatSnow, landMask, bounds }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain asset size must be an integer >= 2.");
  const expected = size * size;
  if (!(heights instanceof Float32Array) || heights.length !== expected) throw new Error("Invalid terrain height buffer.");
  if (!(normals instanceof Int8Array) || normals.length !== expected * 3) throw new Error("Invalid terrain normal buffer.");
  if (!(splatRgba instanceof Uint8Array) || splatRgba.length !== expected * 4) throw new Error("Invalid terrain RGBA splat buffer.");
  if (!(splatSnow instanceof Uint8Array) || splatSnow.length !== expected) throw new Error("Invalid terrain snow splat buffer.");
  if (!(landMask instanceof Uint8Array) || landMask.length !== expected) throw new Error("Invalid terrain land-mask buffer.");
  const headerBytes = 52;
  const lengths = [heights.byteLength, normals.byteLength, splatRgba.byteLength, splatSnow.byteLength, landMask.byteLength];
  const output = new ArrayBuffer(headerBytes + lengths.reduce((sum, value) => sum + value, 0));
  const bytes = new Uint8Array(output); bytes.set(MAGIC, 0);
  const view = new DataView(output); let cursor = 4;
  view.setUint16(cursor, TERRAIN_BINARY_VERSION, true); cursor += 2; view.setUint16(cursor, size, true); cursor += 2;
  for (const value of [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, minHeight(heights), maxHeight(heights)]) { view.setFloat32(cursor, value, true); cursor += 4; }
  const offsets = [];
  for (const length of lengths) { offsets.push(cursor); view.setUint32(cursor, length, true); cursor += 4; }
  copyBytes(bytes, offsets[0], heights); copyBytes(bytes, offsets[1], normals); copyBytes(bytes, offsets[2], splatRgba); copyBytes(bytes, offsets[3], splatSnow); copyBytes(bytes, offsets[4], landMask);
  return new Uint8Array(output);
}

export function decodeTerrainTile(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 52 || !MAGIC.every((value, index) => bytes[index] === value)) throw new Error("Invalid HTRN terrain asset.");
  let cursor = 4; const version = view.getUint16(cursor, true); cursor += 2; const size = view.getUint16(cursor, true); cursor += 2;
  const bounds = {}; for (const key of ["minX", "minY", "maxX", "maxY", "minHeight", "maxHeight"]) { bounds[key] = view.getFloat32(cursor, true); cursor += 4; }
  const entries = []; for (let i = 0; i < 5; i += 1) { const length = view.getUint32(cursor, true); cursor += 4; entries.push({ offset: cursor, length }); cursor += length; }
  if (version !== TERRAIN_BINARY_VERSION || size < 2 || entries.at(-1).offset > bytes.length) throw new Error("Invalid HTRN terrain asset header.");
  const slice = (entry) => bytes.subarray(entry.offset, entry.offset + entry.length);
  const heightBytes = slice(entries[0]);
  if (heightBytes.byteOffset % 4 !== 0) throw new Error("HTRN height payload is not 4-byte aligned.");
  return Object.freeze({ version, size, bounds, heights: new Float32Array(heightBytes.buffer, heightBytes.byteOffset, heightBytes.length / 4), normals: new Int8Array(slice(entries[1]).buffer, slice(entries[1]).byteOffset, entries[1].length), splatRgba: slice(entries[2]), splatSnow: slice(entries[3]), landMask: slice(entries[4]) });
}

function copyBytes(target, offset, typed) { target.set(new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength), offset); }
function minHeight(values) { let result = Infinity; for (const value of values) if (Number.isFinite(value)) result = Math.min(result, value); return Number.isFinite(result) ? result : 0; }
function maxHeight(values) { let result = -Infinity; for (const value of values) if (Number.isFinite(value)) result = Math.max(result, value); return Number.isFinite(result) ? result : 0; }
