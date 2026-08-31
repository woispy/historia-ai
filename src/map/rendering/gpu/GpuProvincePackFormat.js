const MAGIC = 0x55475048; // HGPU little-endian
export const GPU_PACK_VERSION = 1;
const HEADER_BYTES = 32;
const PROVINCE_BYTES = 64;
const TILE_BYTES = 24;

function textBytes(text) { return new TextEncoder().encode(String(text)); }

export function encodeGpuProvincePack(pack) {
  const strings = [];
  const stringOffsets = new Map();
  const addString = (value) => {
    const key = String(value);
    if (stringOffsets.has(key)) return stringOffsets.get(key);
    const offset = strings.reduce((n, item) => n + item.length + 1, 0);
    strings.push(textBytes(key)); stringOffsets.set(key, offset); return offset;
  };
  for (const province of pack.provinces ?? []) addString(province.provinceId);
  const stringBytes = strings.reduce((n, item) => n + item.length + 1, 0);
  const vertexBytes = (pack.vertices?.length ?? 0) * 4;
  const indexBytes = (pack.indices?.length ?? 0) * 4;
  const provinceCount = pack.provinces?.length ?? 0;
  const tileCount = pack.tiles?.length ?? 0;
  const total = HEADER_BYTES + vertexBytes + indexBytes + provinceCount * PROVINCE_BYTES + tileCount * TILE_BYTES + stringBytes;
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer); let cursor = HEADER_BYTES;
  view.setUint32(0, MAGIC, true); view.setUint32(4, GPU_PACK_VERSION, true);
  view.setUint32(8, pack.vertices.length / 2, true); view.setUint32(12, pack.indices.length, true);
  view.setUint32(16, provinceCount, true); view.setUint32(20, tileCount, true);
  view.setUint32(24, pack.tileSize * 1000000, true); view.setUint32(28, pack.quantization, true);
  new Float32Array(buffer, cursor, pack.vertices.length).set(pack.vertices); cursor += vertexBytes;
  new Uint32Array(buffer, cursor, pack.indices.length).set(pack.indices); cursor += indexBytes;
  for (const province of pack.provinces ?? []) {
    const b = province.bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    view.setFloat32(cursor, b.minX, true); view.setFloat32(cursor + 4, b.minY, true); view.setFloat32(cursor + 8, b.maxX, true); view.setFloat32(cursor + 12, b.maxY, true);
    view.setUint32(cursor + 16, addString(province.provinceId), true);
    for (let lod = 0; lod < 4; lod += 1) { const r = province.lodRanges[lod] ?? { firstIndex: 0, indexCount: 0 }; view.setUint32(cursor + 20 + lod * 8, r.firstIndex, true); view.setUint32(cursor + 24 + lod * 8, r.indexCount, true); }
    cursor += PROVINCE_BYTES;
  }
  for (const tile of pack.tiles ?? []) {
    view.setInt32(cursor, tile.x, true); view.setInt32(cursor + 4, tile.y, true);
    const ids = tile.provinceIndices ?? []; view.setUint32(cursor + 8, ids.length, true);
    view.setUint32(cursor + 12, ids[0] ?? 0, true); view.setUint32(cursor + 16, ids[ids.length - 1] ?? 0, true); view.setUint32(cursor + 20, addString(tile.tileId), true); cursor += TILE_BYTES;
  }
  for (const bytes of strings) { new Uint8Array(buffer, cursor, bytes.length).set(bytes); cursor += bytes.length; new Uint8Array(buffer, cursor, 1)[0] = 0; cursor += 1; }
  return buffer;
}

export function decodeGpuProvincePack(buffer) {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("GPU pack decoder requires ArrayBuffer");
  const view = new DataView(buffer); if (view.getUint32(0, true) !== MAGIC) throw new Error("Invalid HGPU pack magic");
  if (view.getUint32(4, true) !== GPU_PACK_VERSION) throw new Error("Unsupported HGPU pack version");
  const vertexCount = view.getUint32(8, true); const indexCount = view.getUint32(12, true); const provinceCount = view.getUint32(16, true); const tileCount = view.getUint32(20, true);
  let cursor = HEADER_BYTES;
  const vertices = new Float32Array(buffer.slice(cursor, cursor + vertexCount * 8)); cursor += vertexCount * 8;
  const indices = new Uint32Array(buffer.slice(cursor, cursor + indexCount * 4)); cursor += indexCount * 4;
  const provinceRaw = [];
  for (let i = 0; i < provinceCount; i += 1) {
    const b = { minX: view.getFloat32(cursor, true), minY: view.getFloat32(cursor + 4, true), maxX: view.getFloat32(cursor + 8, true), maxY: view.getFloat32(cursor + 12, true) };
    const idOffset = view.getUint32(cursor + 16, true); const lodRanges = [];
    for (let lod = 0; lod < 4; lod += 1) lodRanges.push({ firstIndex: view.getUint32(cursor + 20 + lod * 8, true), indexCount: view.getUint32(cursor + 24 + lod * 8, true) });
    provinceRaw.push({ provinceIndex: i, idOffset, bounds: b, lodRanges }); cursor += PROVINCE_BYTES;
  }
  const tiles = [];
  for (let i = 0; i < tileCount; i += 1) { tiles.push({ x: view.getInt32(cursor, true), y: view.getInt32(cursor + 4, true), provinceStart: view.getUint32(cursor + 12, true), provinceEnd: view.getUint32(cursor + 16, true), idOffset: view.getUint32(cursor + 20, true) }); cursor += TILE_BYTES; }
  const stringBase = cursor;
  const readString = (offset) => { let end = stringBase + offset; while (end < buffer.byteLength && view.getUint8(end) !== 0) end += 1; return new TextDecoder().decode(new Uint8Array(buffer, stringBase + offset, end - (stringBase + offset))); };
  return Object.freeze({ version: GPU_PACK_VERSION, tileSize: view.getUint32(24, true) / 1000000, quantization: view.getUint32(28, true), vertices, indices, provinces: Object.freeze(provinceRaw.map((p) => Object.freeze({ ...p, provinceId: readString(p.idOffset) }))), tiles: Object.freeze(tiles.map((t) => Object.freeze({ ...t, tileId: readString(t.idOffset) }))) });
}
