/**
 * Historia AI — Province Structure of Arrays (SoA).
 *
 * Runtime province state is intentionally kept out of per-frame object graphs.
 * Geometry remains immutable; hot simulation/render state lives in typed arrays.
 */

const EMPTY = 0;

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
      const center = getCenter(entry?.geometry, bounds);
      this.ids[index] = id;
      this.owner[index] = numericId(entry?.country?.id, EMPTY);
      this.minX[index] = bounds.minX;
      this.minY[index] = bounds.minY;
      this.maxX[index] = bounds.maxX;
      this.maxY[index] = bounds.maxY;
      this.centerX[index] = center[0];
      this.centerY[index] = center[1];
      this.flags[index] = 1;
      this.idToIndex.set(String(entry?.province?.id ?? id), index);
    });
  }

  indexOf(provinceId) {
    const index = this.idToIndex.get(String(provinceId));
    return index === undefined ? -1 : index;
  }

  fillBounds(index, out = new Float32Array(4)) {
    if (index < 0 || index >= this.count) return null;
    out[0] = this.minX[index];
    out[1] = this.minY[index];
    out[2] = this.maxX[index];
    out[3] = this.maxY[index];
    return out;
  }
}

function numericId(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getBounds(geometry) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const polygon of geometry?.polygons ?? []) {
    for (const point of polygon ?? []) {
      const x = Number(point?.[0]);
      const y = Number(point?.[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
  }
  if (!Number.isFinite(bounds[0])) return [0, 0, 0, 0];
  return { minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3] };
}

function getCenter(geometry, bounds) {
  const points = [];
  for (const polygon of geometry?.polygons ?? []) {
    for (const point of polygon ?? []) {
      if (Array.isArray(point) && point.length >= 2) points.push(point);
    }
  }
  if (!points.length) return [(bounds.minX + bounds.maxX) * 0.5, (bounds.minY + bounds.maxY) * 0.5];
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += Number(point[0]) || 0;
    y += Number(point[1]) || 0;
  }
  return [x / points.length, y / points.length];
}

export default ProvinceSoA;
