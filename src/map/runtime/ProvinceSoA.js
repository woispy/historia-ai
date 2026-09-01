/**
 * Historia AI — Province Structure of Arrays (SoA).
 *
 * Binary assets are the runtime authority. fromBinary() creates typed views
 * directly over the immutable mapbin buffer; no geometry traversal occurs.
 */
import { MAPBIN_LAYOUT } from "./BinaryMapAssetSource.js";

const { PROVINCE_STRIDE_BYTES: STRIDE } = MAPBIN_LAYOUT;

export class ProvinceSoA {
  constructor(entries = []) {
    this.count = entries.length;
    this.idToIndex = new Map();
    this.ids = new Uint32Array(this.count);
    this.owner = new Int32Array(this.count);
    this.minX = new Float32Array(this.count);
    this.minY = new Float32Array(this.count);
    this.maxX = new Float32Array(this.count);
    this.maxY = new Float32Array(this.count);
    this.centerX = new Float32Array(this.count);
    this.centerY = new Float32Array(this.count);
    this.flags = new Uint32Array(this.count);
    entries.forEach((entry, index) => {
      const id = numericId(entry?.province?.id, index + 1);
      const bounds = getBounds(entry?.geometry);
      this.ids[index] = id;
      this.owner[index] = numericId(entry?.country?.id, 0);
      this.minX[index] = bounds.minX; this.minY[index] = bounds.minY;
      this.maxX[index] = bounds.maxX; this.maxY[index] = bounds.maxY;
      this.centerX[index] = (bounds.minX + bounds.maxX) * 0.5;
      this.centerY[index] = (bounds.minY + bounds.maxY) * 0.5;
      this.flags[index] = 1;
      this.idToIndex.set(String(entry?.province?.id ?? id), index);
    });
  }

  static fromBinary(buffer, offsets) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError("ProvinceSoA.fromBinary requires an ArrayBuffer");
    if (!offsets || !Number.isInteger(offsets.provinceOffset) || !Number.isInteger(offsets.provinceCount)) {
      throw new TypeError("ProvinceSoA.fromBinary requires provinceOffset and provinceCount");
    }
    const { provinceOffset, provinceCount } = offsets;
    if (provinceOffset % 4 !== 0 || provinceOffset < 0 || provinceOffset + provinceCount * STRIDE > buffer.byteLength) {
      throw new RangeError("ProvinceSoA binary range is out of bounds");
    }

    const table = new DataView(buffer, provinceOffset, provinceCount * STRIDE);
    const soa = Object.create(ProvinceSoA.prototype);
    soa.count = provinceCount;
    soa.idToIndex = new Map();
    soa.ids = new Uint32Array(provinceCount);
    soa.owner = new Int32Array(provinceCount);
    soa.minX = new Float32Array(provinceCount);
    soa.minY = new Float32Array(provinceCount);
    soa.maxX = new Float32Array(provinceCount);
    soa.maxY = new Float32Array(provinceCount);
    soa.centerX = new Float32Array(provinceCount);
    soa.centerY = new Float32Array(provinceCount);
    soa.flags = new Uint32Array(provinceCount);

    for (let i = 0; i < provinceCount; i += 1) {
      const byte = i * STRIDE;
      const id = table.getUint32(byte, true);
      const owner = table.getUint32(byte + 4, true);
      const minX = table.getFloat32(byte + 16, true);
      const minY = table.getFloat32(byte + 20, true);
      const maxX = table.getFloat32(byte + 24, true);
      const maxY = table.getFloat32(byte + 28, true);
      soa.ids[i] = id; soa.owner[i] = owner;
      soa.minX[i] = minX; soa.minY[i] = minY; soa.maxX[i] = maxX; soa.maxY[i] = maxY;
      soa.centerX[i] = (minX + maxX) * 0.5;
      soa.centerY[i] = (minY + maxY) * 0.5;
      soa.flags[i] = 1;
      soa.idToIndex.set(String(id), i);
    }
    soa.binaryBuffer = buffer;
    soa.binaryProvinceTable = table;
    return soa;
  }

  indexOf(provinceId) {
    const index = this.idToIndex.get(String(provinceId));
    return index === undefined ? -1 : index;
  }

  fillBounds(index, out = new Float32Array(4)) {
    if (index < 0 || index >= this.count) return null;
    out[0] = this.minX[index]; out[1] = this.minY[index]; out[2] = this.maxX[index]; out[3] = this.maxY[index];
    return out;
  }
}

function numericId(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed >>> 0 : fallback;
}

function getBounds(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const polygon of geometry?.polygons ?? []) for (const point of polygon ?? []) {
    const x = Number(point?.[0]); const y = Number(point?.[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

export default ProvinceSoA;
