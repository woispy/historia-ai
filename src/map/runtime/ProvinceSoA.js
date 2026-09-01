/** Historia AI — runtime Province Structure of Arrays. */
import { MAPBIN_LAYOUT } from "./BinaryMapAssetSource.js";

const { PROVINCE_FIELD_COUNT } = MAPBIN_LAYOUT;

export class ProvinceSoA {
  constructor(entries = []) {
    this.count = entries.length;
    this.ids = new Uint32Array(this.count); this.owner = new Int32Array(this.count);
    this.minX = new Float32Array(this.count); this.minY = new Float32Array(this.count);
    this.maxX = new Float32Array(this.count); this.maxY = new Float32Array(this.count);
    this.centerX = new Float32Array(this.count); this.centerY = new Float32Array(this.count);
    this.flags = new Uint32Array(this.count); this.idToIndex = new Map();
    entries.forEach((entry, i) => {
      const points = (entry?.geometry?.polygons ?? []).flat().filter((p) => Array.isArray(p) && p.length >= 2);
      const bounds = boundsOf(points);
      const id = numericId(entry?.province?.id, i + 1);
      this.ids[i] = id; this.owner[i] = numericId(entry?.country?.id, 0);
      this.minX[i] = bounds.minX; this.minY[i] = bounds.minY; this.maxX[i] = bounds.maxX; this.maxY[i] = bounds.maxY;
      this.centerX[i] = (bounds.minX + bounds.maxX) * 0.5; this.centerY[i] = (bounds.minY + bounds.maxY) * 0.5;
      this.flags[i] = 1; this.idToIndex.set(String(entry?.province?.id ?? id), i);
    });
  }

  static fromBinary(buffer, offsets) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError("ProvinceSoA.fromBinary requires ArrayBuffer");
    const count = Number(offsets?.provinceCount); const base = Number(offsets?.provinceOffset);
    if (!Number.isInteger(count) || count < 0 || !Number.isInteger(base) || base < 0 || base % 4) throw new TypeError("Invalid binary province offsets");
    const bytes = count * PROVINCE_FIELD_COUNT * 4;
    if (base + bytes > buffer.byteLength) throw new RangeError("ProvinceSoA binary range is out of bounds");
    const soa = Object.create(ProvinceSoA.prototype);
    soa.count = count;
    soa.ids = new Uint32Array(buffer, base, count);
    soa.owner = new Uint32Array(buffer, base + count * 4, count);
    soa.minX = new Float32Array(buffer, base + count * 8, count);
    soa.minY = new Float32Array(buffer, base + count * 12, count);
    soa.maxX = new Float32Array(buffer, base + count * 16, count);
    soa.maxY = new Float32Array(buffer, base + count * 20, count);
    soa.centerX = new Float32Array(buffer, base + count * 24, count);
    soa.centerY = new Float32Array(buffer, base + count * 28, count);
    soa.flags = new Uint32Array(count); // Derived runtime flags; binary geometry/state remains untouched.
    soa.flags.fill(1);
    soa.idToIndex = new Map();
    for (let i = 0; i < count; i += 1) soa.idToIndex.set(String(soa.ids[i]), i);
    soa.binaryBuffer = buffer;
    soa.binaryProvinceOffset = base;
    return soa;
  }

  indexOf(provinceId) { return this.idToIndex.get(String(provinceId)) ?? -1; }
  fillBounds(index, out = new Float32Array(4)) {
    if (index < 0 || index >= this.count) return null;
    out[0] = this.minX[index]; out[1] = this.minY[index]; out[2] = this.maxX[index]; out[3] = this.maxY[index]; return out;
  }
}

function numericId(value, fallback) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n >>> 0 : fallback; }
function boundsOf(points) {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Number(points[0][0]), minY = Number(points[0][1]), maxX = minX, maxY = minY;
  for (const point of points) { const x = Number(point[0]), y = Number(point[1]); if (Number.isFinite(x) && Number.isFinite(y)) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } }
  return { minX, minY, maxX, maxY };
}
export default ProvinceSoA;
