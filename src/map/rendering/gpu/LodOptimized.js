/**
 * Historia AI — Optimized LOD Generation
 *
 * Incremental LOD generation with spatial indexing and memoization.
 * Replaces the O(n²) per-ring simplification with incremental grid-based decimation.
 */

const EPSILON = 1e-10;
const POSITION_EPSILON = 1e-7;
const COLLINEAR_EPSILON = 1e-12;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= POSITION_EPSILON ** 2;

const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

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
    const key = `${Math.round(p[0] / 1e-7)},${Math.round(p[1] / 1e-7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
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
      if (
        same(a, c) ||
        squaredDistance(a, b) <= POSITION_EPSILON ** 2 ||
        squaredDistance(b, c) <= POSITION_EPSILON ** 2 ||
        Math.abs(cross(a, b, c)) <= COLLINEAR_EPSILON * scale
      ) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }

  normalizationCache.set(key, out);
  return out;
}

/**
 * Grid-based vertex decimation for fast LOD generation.
 * Uses a uniform grid to merge nearby vertices in O(n) instead of O(n²).
 */
function decimateRingGrid(ring, targetCount) {
  if (ring.length <= targetCount) return ring;

  // Compute bounds
  let minX = ring[0][0], minY = ring[0][1];
  let maxX = ring[0][0], maxY = ring[0][1];
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Build spatial grid
  const cellSize = estimateCellSize(ring);
  const grid = new Map();

  for (let i = 0; i < ring.length; i++) {
    const [x, y] = ring[i];
    const gx = Math.floor((x - minX) / cellSize);
    const gy = Math.floor((y - minY) / cellSize);
    const key = `${gx},${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ index: i, x, y });
  }

  // For each cell, keep only the centroid representative
  const result = [];
  for (const [, points] of grid) {
    if (points.length === 1) {
      result.push([points[0].x, points[0].y]);
    } else {
      // Use centroid of cell points
      let cx = 0, cy = 0;
      for (const p of points) { cx += p.x; cy += p.y; }
      result.push([cx / points.length, cy / points.length]);
    }
  }

  return result.length >= 3 ? result : ring.slice(0, targetCount);
}

function estimateCellSize(points) {
  if (points.length < 2) return 1;
  let totalLen = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    totalLen += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return Math.max(1e-6, totalLen / points.length / 10);
}

function simplifyRingCached(ring, target) {
  if (ring.length <= target || target < 3) return ring;
  // Use cached normalization
  const normalized = normalizeRingCached(ring);
  if (normalized.length <= target) return normalized;

  // Use grid-based decimation for large reductions
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
