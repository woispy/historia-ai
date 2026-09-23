/**
 * Historia AI — Optimized LOD Generation
 *
 * Incremental LOD generation with spatial indexing and memoization.
 */

const POSITION_EPSILON = 1e-7;
const COLLINEAR_EPSILON = 1e-12;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= POSITION_EPSILON ** 2;
const normalizationCache = new Map();

function normalizeRingCached(ring) {
  const key = ring.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|');
  if (normalizationCache.has(key)) return normalizationCache.get(key);
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const pointKey = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(pointKey)) continue;
    seen.add(pointKey);
    out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();
  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (same(a, c) || squaredDistance(a, b) <= POSITION_EPSILON ** 2 || squaredDistance(b, c) <= POSITION_EPSILON ** 2 || Math.abs(cross(a, b, c)) <= COLLINEAR_EPSILON * scale) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  normalizationCache.set(key, out);
  return out;
}

function decimateRingGrid(ring, targetCount) {
  if (ring.length <= targetCount) return ring;
  let minX = ring[0][0];
  let minY = ring[0][1];
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  const cellSize = estimateCellSize(ring);
  const grid = new Map();
  for (const [x, y] of ring) {
    const key = `${Math.floor((x - minX) / cellSize)},${Math.floor((y - minY) / cellSize)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ x, y });
  }
  const result = [];
  for (const points of grid.values()) {
    if (points.length === 1) result.push([points[0].x, points[0].y]);
    else {
      let cx = 0;
      let cy = 0;
      for (const point of points) { cx += point.x; cy += point.y; }
      result.push([cx / points.length, cy / points.length]);
    }
  }
  return result.length >= 3 ? result : ring.slice(0, targetCount);
}

function estimateCellSize(points) {
  if (points.length < 2) return 1;
  let totalLen = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    totalLen += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return Math.max(1e-6, totalLen / points.length / 10);
}

function simplifyRingCached(ring, target) {
  if (ring.length <= target || target < 3) return ring;
  const normalized = normalizeRingCached(ring);
  if (normalized.length <= target) return normalized;
  return decimateRingGrid(normalized, target);
}

function buildLodRingsOptimized(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRingCached(ring);
  if (source.length < 3) return levels.map(() => source.slice());
  const output = [];
  let previous = source;
  for (let level = 0; level < levels.length; level += 1) {
    const factor = Number(levels[level]);
    const target = Math.min(previous.length, Math.max(3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1))));
    const candidate = level === 0 ? source : simplifyRingCached(previous, target);
    output.push(candidate);
    previous = candidate;
  }
  return output;
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  return buildLodRingsOptimized(ring, levels);
}

export { normalizeRingCached, simplifyRingCached, estimateCellSize };
