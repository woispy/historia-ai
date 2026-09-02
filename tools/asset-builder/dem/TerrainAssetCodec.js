const MAGIC = new Uint8Array([0x48, 0x54, 0x52, 0x4e]); // HTRN
export const TERRAIN_BINARY_VERSION = 1;

export function encodeTerrainTile({ size, heights, normals, splatRgba, splatSnow, landMask, bounds }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain asset size must be an integer >= 2.");
  if (!(heights instanceof Float32Array) || heights.length !== size * size) throw new Error("Invalid terrain height buffer.");
  if (!(normals instanceof Int8Array) || normals.length !== size * size * 3) throw new Error("Invalid terrain normal buffer.");
  if (!(splatRgba instanceof Uint8Array) || splatRgba.length !== size * size * 4) throw new Error("Invalid terrain RGBA splat buffer.");
  if (!(splatSnow instanceof Uint8Array) || splatSnow.length !== size * size) throw new Error("Invalid terrain snow splat buffer.");
  if (!(landMask instanceof Uint8Array) || landMask.length !== size * size) throw new Error("Invalid terrain land-mask buffer.");
  const headerBytes = 4 + 2 + 2 + 6 * 4 + 4 * 4;
  const payloadBytes = heights.byteLength + normals.byteLength + splatRgba.byteLength + splatSnow.byteLength + landMask.byteLength;
  const output = new ArrayBuffer(headerBytes + payloadBytes);
  const bytes = new Uint8Array(output);
  bytes.set(MAGIC, 0);
  const view = new DataView(output);
  let cursor = 4;
  view.setUint16(cursor, TERRAIN_BINARY_VERSION, true); cursor += 2;
  view.setUint16(cursor, size, true); cursor += 2;
  const values = [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, minHeight(heights), maxHeight(heights)];
  for (const value of values) { view.setFloat32(cursor, value, true); cursor += 4; }
  const offsets = [];
  for (const bytesLength of [heights.byteLength, normals.byteLength, splatRgba.byteLength, splatSnow.byteLength, landMask.byteLength]) { offsets.push(cursor); view.setUint32(cursor, bytesLength, true); cursor += 4; }
  new Uint8Array(output, offsets[0], heights.byteLength).set(new Uint8Array(heights.buffer, heights.byteOffset, heights.byteLength));
  new Uint8Array(output, offsets[1], normals.byteLength).set(new Uint8Array(normals.buffer, normals.byteOffset, normals.byteLength));
  new Uint8Array(output, offsets[2], splatRgba.byteLength).set(splatRgba);
  new Uint8Array(output, offsets[3], splatSnow.byteLength).set(splatSnow);
  new Uint8Array(output, offsets[4], landMask.byteLength).set(landMask);
  return new Uint8Array(output);
}

export function decodeTerrainTile(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 48 || !MAGIC.every((value, index) => bytes[index] === value)) throw new Error("Invalid HTRN terrain asset.");
  let cursor = 4;
  const version = view.getUint16(cursor, true); cursor += 2;
  const size = view.getUint16(cursor, true); cursor += 2;
  const bounds = {};
  for (const key of ["minX", "minY", "maxX", "maxY", "minHeight", "maxHeight"]) { bounds[key] = view.getFloat32(cursor, true); cursor += 4; }
  const buffers = [];
  for (let i = 0; i < 5; i += 1) { const length = view.getUint32(cursor, true); cursor += 4; buffers.push({ offset: cursor, length }); cursor += length; }
  if (version !== TERRAIN_BINARY_VERSION || !Number.isInteger(size) || size < 2 || buffers.at(-1).offset > bytes.length) throw new Error("Invalid HTRN terrain asset header.");
  const byteView = (entry) => bytes.subarray(entry.offset, entry.offset + entry.length);
  return Object.freeze({ version, size, bounds, heights: new Float32Array(byteView(buffers[0]).buffer, byteView(buffers[0]).byteOffset, buffers[0].length / 4), normals: new Int8Array(byteView(buffers[1]).buffer, byteView(buffers[1]).byteOffset, buffers[1].length), splatRgba: byteView(buffers[2]), splatSnow: byteView(buffers[3]), landMask: byteView(buffers[4]) });
}

function minHeight(values) { let result = Infinity; for (const value of values) if (Number.isFinite(value) && value < result) result = value; return Number.isFinite(result) ? result : 0; }
function maxHeight(values) { let result = -Infinity; for (const value of values) if (Number.isFinite(value) && value > result) result = value; return Number.isFinite(result) ? result : 0; }
