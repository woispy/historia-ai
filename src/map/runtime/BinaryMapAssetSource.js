const MAGIC = 0x484D4150; // HMAP
const VERSION = 1;
const HEADER_BYTES = 64;
const PROVINCE_FIELD_COUNT = 8;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;
const CITY_STRIDE = 6;

const HEADER = Object.freeze({
  magic: 0, version: 4, flags: 6, provinceCount: 8, tileCount: 12,
  geometryPointCount: 16, lodRangeCount: 20, cityCount: 24,
  provinceOffset: 28, tileOffset: 32, geometryOffset: 36, lodOffset: 40,
  cityOffset: 44, paletteOffset: 48, paletteByteLength: 52, totalByteLength: 56,
});

/** Immutable zero-copy view over a versioned .mapbin ArrayBuffer. */
export class BinaryMapAssetSource {
  constructor(buffer) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError("BinaryMapAssetSource requires an ArrayBuffer");
    if (buffer.byteLength < HEADER_BYTES) throw new RangeError("Invalid mapbin: truncated header");
    this.buffer = buffer;
    this.header = readHeader(buffer);
    validateHeader(this.header, buffer.byteLength);

    const p = this.header.provinceOffset;
    const n = this.header.provinceCount;
    this.ids = new Uint32Array(buffer, p, n);
    this.owner = new Uint32Array(buffer, p + n * 4, n);
    this.minX = new Float32Array(buffer, p + n * 8, n);
    this.minY = new Float32Array(buffer, p + n * 12, n);
    this.maxX = new Float32Array(buffer, p + n * 16, n);
    this.maxY = new Float32Array(buffer, p + n * 20, n);
    this.centerX = new Float32Array(buffer, p + n * 24, n);
    this.centerY = new Float32Array(buffer, p + n * 28, n);
    this.tileIndex = new Uint32Array(buffer, this.header.tileOffset, this.header.tileCount * TILE_STRIDE);
    this.geometry = new Float32Array(buffer, this.header.geometryOffset, this.header.geometryPointCount * 2);
    this.lodRanges = new Uint32Array(buffer, this.header.lodOffset, this.header.lodRangeCount * LOD_STRIDE);
    this.cityBlocks = new Float32Array(buffer, this.header.cityOffset, this.header.cityCount * CITY_STRIDE);
    this.palette = new Uint8Array(buffer, this.header.paletteOffset, this.header.paletteByteLength);
    this.idToIndex = new Map();
    for (let i = 0; i < n; i += 1) this.idToIndex.set(String(this.ids[i]), i);
    Object.freeze(this.header);
  }

  static fromArrayBuffer(buffer) { return new BinaryMapAssetSource(buffer); }
  get provinceCount() { return this.header.provinceCount; }
  get tileCount() { return this.header.tileCount; }
  get geometryPointCount() { return this.header.geometryPointCount; }
  getProvinceId(index) { return this.ids[index] ?? 0; }
  getProvinceGeometryRange(index, lod = 0) {
    if (index < 0 || index >= this.provinceCount) return null;
    const lodIndex = this.ids.length > index ? new DataView(this.buffer, this.header.provinceOffset + this.provinceCount * 28, this.provinceCount * 4).getUint32(index * 4, true) : 0;
    const selected = lodIndex + lod;
    if (selected >= this.header.lodRangeCount) return null;
    const base = selected * LOD_STRIDE;
    return { pointOffset: this.lodRanges[base], pointCount: this.lodRanges[base + 1] };
  }
  geometryView(pointOffset, pointCount) {
    if (pointOffset < 0 || pointCount < 0 || pointOffset + pointCount > this.geometryPointCount) throw new RangeError("Geometry range out of bounds");
    return new Float32Array(this.buffer, this.header.geometryOffset + pointOffset * 8, pointCount * 2);
  }
  tileRecord(index) { return this.tileIndex.subarray(index * TILE_STRIDE, index * TILE_STRIDE + TILE_STRIDE); }
  lodRecord(index) { return this.lodRanges.subarray(index * LOD_STRIDE, index * LOD_STRIDE + LOD_STRIDE); }
  cityRecord(index) { return this.cityBlocks.subarray(index * CITY_STRIDE, index * CITY_STRIDE + CITY_STRIDE); }
  indexOf(provinceId) { return this.idToIndex.get(String(provinceId)) ?? -1; }

  /** Build-time encoder. Runtime consumption remains zero-copy. */
  static fromProvinceEntries(entries = []) {
    const n = entries.length;
    const ids = new Uint32Array(n), owner = new Uint32Array(n);
    const minX = new Float32Array(n), minY = new Float32Array(n), maxX = new Float32Array(n), maxY = new Float32Array(n);
    const centerX = new Float32Array(n), centerY = new Float32Array(n);
    const geometry = [], lod = [], tiles = [];
    for (let i = 0; i < n; i += 1) {
      const entry = entries[i];
      ids[i] = numericId(entry?.province?.id, i + 1); owner[i] = numericId(entry?.country?.id, 0);
      const points = [];
      for (const polygon of entry?.geometry?.polygons ?? []) for (const point of polygon ?? []) {
        const x = Number(point?.[0]), y = Number(point?.[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
      }
      const bounds = computeBounds(points);
      minX[i] = bounds.minX; minY[i] = bounds.minY; maxX[i] = bounds.maxX; maxY[i] = bounds.maxY;
      centerX[i] = (bounds.minX + bounds.maxX) * 0.5; centerY[i] = (bounds.minY + bounds.maxY) * 0.5;
      const pointOffset = geometry.length / 2;
      for (const [x, y] of points) geometry.push(x, y);
      lod.push(pointOffset, points.length, 0, 0);
      tiles.push(pointOffset, points.length, i, 0, 0, 0);
    }
    const palette = new Uint8Array(Math.max(4, (n + 1) * 4));
    entries.forEach((entry, i) => palette.set(parseColor(entry?.country?.color), (i + 1) * 4));
    return pack({ ids, owner, minX, minY, maxX, maxY, centerX, centerY, geometry, lod, tiles, palette });
  }
}

export function buildBinaryMapAssetSource(entries) { return BinaryMapAssetSource.fromArrayBuffer(BinaryMapAssetSource.fromProvinceEntries(entries)); }

function pack(data) {
  const n = data.ids.length;
  const provinceBytes = n * PROVINCE_FIELD_COUNT * 4;
  const tileBytes = data.tiles.length * 4, geometryBytes = data.geometry.length * 4, lodBytes = data.lod.length * 4;
  const cityBytes = 0, paletteOffset = HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes + cityBytes;
  const total = paletteOffset + data.palette.byteLength;
  const buffer = new ArrayBuffer(total), view = new DataView(buffer);
  view.setUint32(HEADER.magic, MAGIC, true); view.setUint16(HEADER.version, VERSION, true); view.setUint16(HEADER.flags, 0, true);
  view.setUint32(HEADER.provinceCount, n, true); view.setUint32(HEADER.tileCount, data.tiles.length / TILE_STRIDE, true);
  view.setUint32(HEADER.geometryPointCount, data.geometry.length / 2, true); view.setUint32(HEADER.lodRangeCount, data.lod.length / LOD_STRIDE, true); view.setUint32(HEADER.cityCount, 0, true);
  view.setUint32(HEADER.provinceOffset, HEADER_BYTES, true); view.setUint32(HEADER.tileOffset, HEADER_BYTES + provinceBytes, true);
  view.setUint32(HEADER.geometryOffset, HEADER_BYTES + provinceBytes + tileBytes, true); view.setUint32(HEADER.lodOffset, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes, true);
  view.setUint32(HEADER.cityOffset, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes, true); view.setUint32(HEADER.paletteOffset, paletteOffset, true);
  view.setUint32(HEADER.paletteByteLength, data.palette.byteLength, true); view.setUint32(HEADER.totalByteLength, total, true);
  let offset = HEADER_BYTES;
  for (const field of [data.ids, data.owner, data.minX, data.minY, data.maxX, data.maxY, data.centerX, data.centerY]) { new Uint8Array(buffer, offset, field.byteLength).set(new Uint8Array(field.buffer, field.byteOffset, field.byteLength)); offset += field.byteLength; }
  new Uint32Array(buffer, offset, data.tiles.length).set(data.tiles); offset += tileBytes;
  new Float32Array(buffer, offset, data.geometry.length).set(data.geometry); offset += geometryBytes;
  new Uint32Array(buffer, offset, data.lod.length).set(data.lod); offset += lodBytes;
  new Uint8Array(buffer, paletteOffset, data.palette.byteLength).set(data.palette);
  return buffer;
}

function readHeader(buffer) { const v = new DataView(buffer); return {
  magic: v.getUint32(0, true), version: v.getUint16(4, true), flags: v.getUint16(6, true), provinceCount: v.getUint32(8, true), tileCount: v.getUint32(12, true), geometryPointCount: v.getUint32(16, true), lodRangeCount: v.getUint32(20, true), cityCount: v.getUint32(24, true), provinceOffset: v.getUint32(28, true), tileOffset: v.getUint32(32, true), geometryOffset: v.getUint32(36, true), lodOffset: v.getUint32(40, true), cityOffset: v.getUint32(44, true), paletteOffset: v.getUint32(48, true), paletteByteLength: v.getUint32(52, true), totalByteLength: v.getUint32(56, true),
}; }
function validateHeader(h, bytes) {
  if (h.magic !== MAGIC) throw new Error("Invalid mapbin magic"); if (h.version !== VERSION) throw new Error(`Unsupported mapbin version: ${h.version}`); if (h.totalByteLength !== bytes) throw new Error("Invalid mapbin length");
  if (h.provinceOffset < HEADER_BYTES || h.provinceOffset % 4) throw new Error("Invalid province offset");
  const end = h.provinceOffset + h.provinceCount * PROVINCE_FIELD_COUNT * 4;
  if (end > bytes || h.tileOffset < end || h.geometryOffset < h.tileOffset || h.lodOffset < h.geometryOffset || h.paletteOffset < h.lodOffset || h.paletteOffset > bytes) throw new Error("Invalid mapbin section offsets");
}
function computeBounds(points) { if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }; let minX = points[0][0], minY = points[0][1], maxX = minX, maxY = minY; for (const [x, y] of points) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } return { minX, minY, maxX, maxY }; }
function numericId(value, fallback) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n >>> 0 : fallback; }
function parseColor(value) { const h = String(value ?? "6f765f").replace(/^#/, ""); if (!/^[0-9a-f]{6}$/i.test(h)) return [111,118,95,255]; return [Number.parseInt(h.slice(0,2),16), Number.parseInt(h.slice(2,4),16), Number.parseInt(h.slice(4,6),16),255]; }

export const MAPBIN_LAYOUT = Object.freeze({ MAGIC, VERSION, HEADER_BYTES, PROVINCE_FIELD_COUNT, TILE_STRIDE, LOD_STRIDE, CITY_STRIDE });
export default BinaryMapAssetSource;
