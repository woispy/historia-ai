const MAGIC = 0x484D4150; // HMAP
const VERSION = 1;
const HEADER_BYTES = 64;
const PROVINCE_STRIDE_BYTES = 48;
const TILE_STRIDE_BYTES = 24;
const LOD_STRIDE_BYTES = 16;
const CITY_STRIDE_BYTES = 24;
const GEOMETRY_COMPONENTS = 2;

const HEADER = Object.freeze({
  magic: 0,
  version: 4,
  flags: 6,
  provinceCount: 8,
  tileCount: 12,
  geometryPointCount: 16,
  lodRangeCount: 20,
  cityCount: 24,
  provinceOffset: 28,
  tileOffset: 32,
  geometryOffset: 36,
  lodOffset: 40,
  cityOffset: 44,
  paletteOffset: 48,
  paletteByteLength: 52,
  totalByteLength: 56,
});

/**
 * Immutable, zero-copy runtime view over a versioned .mapbin payload.
 * The source never owns mutable copies of geometry/state; every public view is
 * a TypedArray backed directly by the supplied ArrayBuffer.
 */
export class BinaryMapAssetSource {
  constructor(buffer) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError("BinaryMapAssetSource requires an ArrayBuffer");
    if (buffer.byteLength < HEADER_BYTES) throw new RangeError("Invalid mapbin: truncated header");
    this.buffer = buffer;
    this.header = readHeader(buffer);
    validateHeader(this.header, buffer.byteLength);

    this.provinceTable = new DataView(buffer, this.header.provinceOffset, this.header.provinceCount * PROVINCE_STRIDE_BYTES);
    this.tileIndex = new Uint32Array(buffer, this.header.tileOffset, this.header.tileCount * 6);
    this.geometry = new Float32Array(buffer, this.header.geometryOffset, this.header.geometryPointCount * GEOMETRY_COMPONENTS);
    this.lodRanges = new Uint32Array(buffer, this.header.lodOffset, this.header.lodRangeCount * 4);
    this.cityBlocks = new Float32Array(buffer, this.header.cityOffset, this.header.cityCount * 6);
    this.palette = new Uint8Array(buffer, this.header.paletteOffset, this.header.paletteByteLength);
    Object.freeze(this.header);
  }

  static fromArrayBuffer(buffer) { return new BinaryMapAssetSource(buffer); }

  get provinceCount() { return this.header.provinceCount; }
  get tileCount() { return this.header.tileCount; }
  get geometryPointCount() { return this.header.geometryPointCount; }

  provinceIds() {
    return new Uint32Array(this.buffer, this.header.provinceOffset, this.header.provinceCount * PROVINCE_STRIDE_BYTES / 4).filter((_, index) => index % 12 === 0);
  }

  getProvinceId(index) { return this.provinceTable.getUint32(index * PROVINCE_STRIDE_BYTES, true); }

  getProvinceRecord(index, out = new Float32Array(8)) {
    if (index < 0 || index >= this.provinceCount) return null;
    const byte = index * PROVINCE_STRIDE_BYTES;
    out[0] = this.provinceTable.getUint32(byte, true);
    out[1] = this.provinceTable.getUint32(byte + 4, true);
    out[2] = this.provinceTable.getUint32(byte + 8, true);
    out[3] = this.provinceTable.getUint32(byte + 12, true);
    out[4] = this.provinceTable.getFloat32(byte + 16, true);
    out[5] = this.provinceTable.getFloat32(byte + 20, true);
    out[6] = this.provinceTable.getFloat32(byte + 24, true);
    out[7] = this.provinceTable.getFloat32(byte + 28, true);
    return out;
  }

  getProvinceGeometryRange(index, lod = 0) {
    if (index < 0 || index >= this.provinceCount) return null;
    const byte = index * PROVINCE_STRIDE_BYTES + 32;
    const lodIndex = this.provinceTable.getUint32(byte + lod * 4, true);
    if (lodIndex >= this.header.lodRangeCount) return null;
    const base = lodIndex * LOD_STRIDE_BYTES;
    const pointOffset = this.lodRanges[base];
    const pointCount = this.lodRanges[base + 1];
    return { pointOffset, pointCount };
  }

  geometryView(pointOffset, pointCount) {
    if (pointOffset < 0 || pointCount < 0 || pointOffset + pointCount > this.geometryPointCount) throw new RangeError("Geometry range out of bounds");
    return new Float32Array(this.buffer, this.header.geometryOffset + pointOffset * 8, pointCount * 2);
  }

  tileRecord(index) {
    const base = index * 6;
    return this.tileIndex.subarray(base, base + 6);
  }

  lodRecord(index) { return this.lodRanges.subarray(index * 4, index * 4 + 4); }
  cityRecord(index) { return this.cityBlocks.subarray(index * 6, index * 6 + 6); }

  provinceIdToIndex() {
    const map = new Map();
    for (let i = 0; i < this.provinceCount; i += 1) map.set(String(this.getProvinceId(i)), i);
    return map;
  }

  /** Build a deterministic mapbin. Build-time only; runtime remains zero-copy. */
  static fromProvinceEntries(entries = []) {
    const provinces = [];
    const lod = [];
    const geometry = [];
    const cities = [];
    const tiles = [];
    for (const entry of entries) {
      const polygons = entry?.geometry?.polygons ?? [];
      const start = geometry.length / 2;
      const points = [];
      for (const polygon of polygons) {
        if (!Array.isArray(polygon) || polygon.length < 3) continue;
        for (const point of polygon) {
          const x = Number(point?.[0]);
          const y = Number(point?.[1]);
          if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
        }
      }
      for (const point of points) geometry.push(point[0], point[1]);
      const bounds = computeBounds(points);
      const centerX = (bounds.minX + bounds.maxX) * 0.5;
      const centerY = (bounds.minY + bounds.maxY) * 0.5;
      const lodIndex = lod.length / 4;
      lod.push(start, points.length, 0, 0);
      provinces.push({
        id: numericId(entry?.province?.id),
        owner: numericId(entry?.country?.id),
        minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY,
        centerX, centerY, lodIndex,
      });
      tiles.push(start, points.length, 0, 0, 0, 0);
    }

    const palette = new Uint8Array(Math.max(4, (provinces.length + 1) * 4));
    entries.forEach((entry, index) => palette.set(parseColor(entry?.country?.color), (index + 1) * 4));
    return pack({ provinces, tiles, geometry, lod, cities, palette });
  }
}

export function buildBinaryMapAssetSource(entries) {
  return BinaryMapAssetSource.fromArrayBuffer(BinaryMapAssetSource.fromProvinceEntries(entries));
}

function pack({ provinces, tiles, geometry, lod, cities, palette }) {
  const provinceBytes = provinces.length * PROVINCE_STRIDE_BYTES;
  const tileBytes = tiles.length * 4;
  const geometryBytes = geometry.length * 4;
  const lodBytes = lod.length * 4;
  const cityBytes = cities.length * 4;
  const paletteOffset = HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes + cityBytes;
  const total = paletteOffset + palette.byteLength;
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  view.setUint32(HEADER.magic, MAGIC, true);
  view.setUint16(HEADER.version, VERSION, true);
  view.setUint16(HEADER.flags, 0, true);
  view.setUint32(HEADER.provinceCount, provinces.length, true);
  view.setUint32(HEADER.tileCount, tiles.length / 6, true);
  view.setUint32(HEADER.geometryPointCount, geometry.length / 2, true);
  view.setUint32(HEADER.lodRangeCount, lod.length / 4, true);
  view.setUint32(HEADER.cityCount, cities.length / 6, true);
  view.setUint32(HEADER.provinceOffset, HEADER_BYTES, true);
  view.setUint32(HEADER.tileOffset, HEADER_BYTES + provinceBytes, true);
  view.setUint32(HEADER.geometryOffset, HEADER_BYTES + provinceBytes + tileBytes, true);
  view.setUint32(HEADER.lodOffset, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes, true);
  view.setUint32(HEADER.cityOffset, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes, true);
  view.setUint32(HEADER.paletteOffset, paletteOffset, true);
  view.setUint32(HEADER.paletteByteLength, palette.byteLength, true);
  view.setUint32(HEADER.totalByteLength, total, true);

  let offset = HEADER_BYTES;
  for (const province of provinces) {
    view.setUint32(offset, province.id, true); view.setUint32(offset + 4, province.owner, true);
    view.setUint32(offset + 8, province.lodIndex, true); view.setUint32(offset + 12, province.lodIndex, true);
    view.setFloat32(offset + 16, province.minX, true); view.setFloat32(offset + 20, province.minY, true);
    view.setFloat32(offset + 24, province.maxX, true); view.setFloat32(offset + 28, province.maxY, true);
    view.setUint32(offset + 32, province.lodIndex, true); view.setUint32(offset + 36, 0, true);
    view.setUint32(offset + 40, 0, true); view.setUint32(offset + 44, 0, true);
    offset += PROVINCE_STRIDE_BYTES;
  }
  new Uint32Array(buffer, HEADER_BYTES + provinceBytes, tiles.length).set(tiles);
  new Float32Array(buffer, HEADER_BYTES + provinceBytes + tileBytes, geometry.length).set(geometry);
  new Uint32Array(buffer, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes, lod.length).set(lod);
  new Float32Array(buffer, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes, cities.length).set(cities);
  new Uint8Array(buffer, paletteOffset, palette.byteLength).set(palette);
  return buffer;
}

function readHeader(buffer) {
  const view = new DataView(buffer);
  return {
    magic: view.getUint32(0, true), version: view.getUint16(4, true), flags: view.getUint16(6, true),
    provinceCount: view.getUint32(8, true), tileCount: view.getUint32(12, true), geometryPointCount: view.getUint32(16, true),
    lodRangeCount: view.getUint32(20, true), cityCount: view.getUint32(24, true), provinceOffset: view.getUint32(28, true),
    tileOffset: view.getUint32(32, true), geometryOffset: view.getUint32(36, true), lodOffset: view.getUint32(40, true),
    cityOffset: view.getUint32(44, true), paletteOffset: view.getUint32(48, true), paletteByteLength: view.getUint32(52, true),
    totalByteLength: view.getUint32(56, true),
  };
}

function validateHeader(h, byteLength) {
  if (h.magic !== MAGIC) throw new Error("Invalid mapbin magic");
  if (h.version !== VERSION) throw new Error(`Unsupported mapbin version: ${h.version}`);
  if (h.totalByteLength !== byteLength) throw new Error("Invalid mapbin length");
  for (const offset of [h.provinceOffset, h.tileOffset, h.geometryOffset, h.lodOffset, h.cityOffset, h.paletteOffset]) {
    if (offset % 4 !== 0 || offset < HEADER_BYTES || offset > byteLength) throw new Error("Invalid mapbin offset");
  }
}

function computeBounds(points) {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = points[0][0], minY = points[0][1], maxX = minX, maxY = minY;
  for (const [x, y] of points) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
}
function numericId(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n >>> 0 : 0; }
function parseColor(value) {
  const hex = String(value ?? "6f765f").replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return [111, 118, 95, 255];
  return [Number.parseInt(hex.slice(0,2),16), Number.parseInt(hex.slice(2,4),16), Number.parseInt(hex.slice(4,6),16), 255];
}

export const MAPBIN_LAYOUT = Object.freeze({ MAGIC, VERSION, HEADER_BYTES, PROVINCE_STRIDE_BYTES, TILE_STRIDE_BYTES, LOD_STRIDE_BYTES, CITY_STRIDE_BYTES });
export default BinaryMapAssetSource;
