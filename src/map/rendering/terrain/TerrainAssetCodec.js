const MAGIC = new Uint8Array([0x48, 0x54, 0x52, 0x4e]);
export const TERRAIN_BINARY_VERSION = 2;
export const TERRAIN_HEIGHT_MIN_METERS = -500;
export const TERRAIN_HEIGHT_MAX_METERS = 9000;

export function sanitizeTerrainHeights(values) {
  if (!(values instanceof Float32Array)) throw new Error("Terrain heights must be a Float32Array.");
  const sanitized = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 1) sanitized[index] = sanitizeTerrainHeight(values[index]);
  return sanitized;
}

export function sanitizeTerrainHeight(value) {
  return Number.isFinite(value) && value >= TERRAIN_HEIGHT_MIN_METERS && value <= TERRAIN_HEIGHT_MAX_METERS ? value : 0;
}

export function encodeTerrainTile({ size, heights, normals, splatRgba, splatSnow, landMask, demValidity, bounds }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain asset size must be an integer >= 2.");
  const expected = size * size;
  if (!(heights instanceof Float32Array) || heights.length !== expected) throw new Error("Invalid terrain height buffer.");
  if (!(normals instanceof Int8Array) || normals.length !== expected * 3) throw new Error("Invalid terrain normal buffer.");
  if (!(splatRgba instanceof Uint8Array) || splatRgba.length !== expected * 4) throw new Error("Invalid terrain RGBA splat buffer.");
  if (!(splatSnow instanceof Uint8Array) || splatSnow.length !== expected) throw new Error("Invalid terrain snow splat buffer.");
  if (!(landMask instanceof Uint8Array) || landMask.length !== expected) throw new Error("Invalid terrain physical-land mask buffer.");
  if (!(demValidity instanceof Uint8Array) || demValidity.length !== expected) throw new Error("Invalid terrain DEM-validity buffer.");
  if (!bounds || !["minX", "minY", "maxX", "maxY"].every((key) => Number.isFinite(bounds[key]))) throw new Error("Invalid terrain bounds.");
  const safeHeights = sanitizeTerrainHeights(heights), safeDemValidity = new Uint8Array(demValidity);
  for (let index = 0; index < expected; index += 1) if (safeHeights[index] !== heights[index]) safeDemValidity[index] = 0;
  const headerBytes = 56;
  const lengths = [safeHeights.byteLength, normals.byteLength, splatRgba.byteLength, splatSnow.byteLength, landMask.byteLength, safeDemValidity.byteLength];
  const output = new ArrayBuffer(headerBytes + lengths.reduce((sum, value) => sum + value, 0));
  const bytes = new Uint8Array(output);
  bytes.set(MAGIC, 0);
  const view = new DataView(output);
  let cursor = 4;
  view.setUint16(cursor, TERRAIN_BINARY_VERSION, true); cursor += 2;
  view.setUint16(cursor, size, true); cursor += 2;
  for (const value of [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, minHeight(safeHeights), maxHeight(safeHeights)]) { view.setFloat32(cursor, value, true); cursor += 4; }
  for (const length of lengths) { view.setUint32(cursor, length, true); cursor += 4; }
  let payloadCursor = headerBytes;
  for (const typed of [safeHeights, normals, splatRgba, splatSnow, landMask, safeDemValidity]) {
    bytes.set(new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength), payloadCursor);
    payloadCursor += typed.byteLength;
  }
  return new Uint8Array(output);
}

export function decodeTerrainTile(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength < 56 || !MAGIC.every((value, index) => bytes[index] === value)) throw new Error("Invalid HTRN terrain asset.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let cursor = 4;
  const version = view.getUint16(cursor, true); cursor += 2;
  const size = view.getUint16(cursor, true); cursor += 2;
  const bounds = {};
  for (const key of ["minX", "minY", "maxX", "maxY", "minHeight", "maxHeight"]) { bounds[key] = view.getFloat32(cursor, true); cursor += 4; }
  const lengths = [];
  for (let i = 0; i < 6; i += 1) { lengths.push(view.getUint32(cursor, true)); cursor += 4; }
  const payloadStart = cursor;
  const payloadBytes = lengths.reduce((sum, value) => sum + value, 0);
  const expectedHeightBytes = size * size * 4;
  if (version !== TERRAIN_BINARY_VERSION || size < 2 || lengths[0] !== expectedHeightBytes || payloadStart + payloadBytes > bytes.byteLength) throw new Error("Invalid HTRN terrain asset header.");
  let offset = payloadStart;
  const slices = lengths.map((length) => { const start = offset; offset += length; return bytes.subarray(start, offset); });
  const heightBytes = slices[0];
  if (heightBytes.byteLength % 4 !== 0) throw new Error("HTRN height payload has invalid byte length.");
  const rawHeights = new Float32Array(heightBytes.buffer, heightBytes.byteOffset, heightBytes.byteLength / 4), heights = sanitizeTerrainHeights(rawHeights), safeDemValidity = new Uint8Array(slices[5]);
  for (let index = 0; index < heights.length; index += 1) if (heights[index] !== rawHeights[index]) safeDemValidity[index] = 0;
  return Object.freeze({ version, size, bounds: Object.freeze({ ...bounds, minHeight: minHeight(heights), maxHeight: maxHeight(heights) }),
    heights,
    normals: new Int8Array(slices[1].buffer, slices[1].byteOffset, slices[1].byteLength),
    splatRgba: slices[2], splatSnow: slices[3], landMask: slices[4], demValidity: safeDemValidity,
  });
}

function minHeight(values) { let result = Infinity; for (const value of values) if (Number.isFinite(value)) result = Math.min(result, value); return Number.isFinite(result) ? result : 0; }
function maxHeight(values) { let result = -Infinity; for (const value of values) if (Number.isFinite(value)) result = Math.max(result, value); return Number.isFinite(result) ? result : 0; }
