/**
 * Historia AI — Optimized Polygon Triangulation
 *
 * High-performance ear-clipping with spatial indexing.
 * Replaces the O(n³) ear-clipping with spatial grid acceleration.
 */

const POSITION_EPSILON = 1e-7;

/**
 * Spatial grid for accelerating point-in-polygon queries.
 * Divides the bounding box into a uniform grid.
 */
class SpatialGrid {
  constructor(points, cellSize) {
    this.cellSize = cellSize;
    if (!points.length) { this.cells = new Map(); return; }

    let minX = points[0][0], minY = points[0][1];
    let maxX = points[0][0], maxY = points[0][1];
    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.cellSize = cellSize;
    this.gridWidth = Math.max(1, Math.ceil((maxX - minX) / cellSize));
    this.gridHeight = Math.max(1, Math.ceil((maxY - minY) / cellSize));
    this.cells = new Map();

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      const gx = Math.floor((x - minX) / cellSize);
      const gy = Math.floor((y - minY) / cellSize);
      const key = gx + ',' + gy;
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(i);
    }
  }

  /**
   * Get point indices in the same or adjacent cells as the triangle's bounding box.
   */
  getCandidatesForTriangle(a, b, c) {
    const minX = Math.min(a[0], b[0], c[0]);
    const maxX = Math.max(a[0], b[0], c[0]);
    const minY = Math.min(a[1], b[1], c[1]);
    const maxY = Math.max(a[1], b[1], c[1]);

    const gx0 = Math.max(0, Math.floor((minX - this.minX) / this.cellSize));
    const gx1 = Math.min(this.gridWidth - 1, Math.floor((maxX - this.minX) / this.cellSize));
    const gy0 = Math.max(0, Math.floor((minY - this.minY) / this.cellSize));
    const gy1 = Math.min(this.gridHeight - 1, Math.floor((maxY - this.minY) / this.cellSize));

    const candidates = new Set();
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const key = gx + ',' + gy;
        const cell = this.cells.get(key);
        if (cell) {
          for (const idx of cell) candidates.add(idx);
        }
      }
    }
    return candidates;
  }
}

/**
 * Cross product of (b-a) x (c-a)
 */
function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= POSITION_EPSILON ** 2;

/**
 * Point-in-triangle test using barycentric coordinates (cross product method).
 */
function pointInTriangle(p, a, b, c) {
  const ab = cross(a, b, p);
  const bc = cross(b, c, p);
  const ca = cross(c, a, p);
  return (ab >= -1e-10 && bc >= -1e-10 && ca >= -1e-10) ||
         (ab <= 1e-10 && bc <= 1e-10 && ca <= 1e-10);
}

/**
 * Estimate grid cell size based on average edge length.
 */
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

/**
 * Optimized ear-clipping triangulation with spatial grid.
 * Uses spatial grid to accelerate point-in-triangle tests.
 */
export function triangulateRingOptimized(ring, context = {}) {
  const points = unwrapRing(normalizeRing(ring));

  if (points.length < 3) return [];
  const area = signedArea(points);
  if (Math.abs(area) <= 1e-12) return [];

  if (points.length > 12000) {
    throw new Error(`Triangulation exceeds safety bound${context.provinceId ? ` province=${context.provinceId}` : ""}; vertices=${points.length}`);
  }

  // Check simplicity
  if (!isSimpleOptimized(points)) return [];

  const n = points.length;
  const ids = Array.from({ length: n }, (_, i) => i);

  // Ensure CCW winding (positive area)
  if (signedArea(points) < 0) ids.reverse();

  // Build spatial grid for point-in-triangle acceleration
  const cellSize = Math.max(1e-4, estimateCellSize(points));
  const grid = new SpatialGrid(points, cellSize);

  const triangles = [];
  let guard = 0;
  const maxGuard = points.length * points.length;

  while (ids.length > 3 && guard++ < maxGuard) {
    let found = -1;
    for (let i = 0; i < ids.length; i += 1) {
      const prev = ids[(i - 1 + ids.length) % ids.length];
      const curr = ids[i];
      const next = ids[(i + 1) % ids.length];

      if (cross(points[prev], points[curr], points[next]) <= 1e-12) continue;

      // Use spatial grid to find only nearby candidates
      const gridCandidates = grid.getCandidatesForTriangle(
        points[prev], points[curr], points[next]
      );

      let contains = false;
      for (const candidate of gridCandidates) {
        if (candidate === prev || candidate === curr || candidate === next) continue;
        if (pointInTriangle(points[candidate], points[prev], points[curr], points[next])) {
          contains = true;
          break;
        }
      }
      if (contains) continue;

      found = i;
      break;
    }

    if (found < 0) return [];

    const prev = ids[(found - 1 + ids.length) % ids.length];
    const curr = ids[found];
    const next = ids[(found + 1) % ids.length];

    triangles.push(prev, curr, next);
    ids.splice(found, 1);
  }

  if (ids.length === 3 && Math.abs(cross(points[ids[0]], points[ids[1]], points[ids[2]])) > 1e-12) {
    triangles.push(ids[0], ids[1], ids[2]);
  }

  return triangles.length === (points.length - 2) * 3 ? triangles : [];
}

/**
 * Normalize ring: remove duplicates, close ring, remove collinear points
 */
function normalizeRing(ring) {
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
  return out;
}

/**
 * Unwrap ring for antimeridian handling
 */
function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0];
    const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}

/**
 * Signed area of polygon
 */
function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/**
 * Optimized simplicity check using spatial grid.
 */
function isSimpleOptimized(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true; // Skip for very large polygons

  // Use spatial grid for intersection detection
  const cellSize = estimateCellSize(points);
  const grid = new Map();

  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);

    const gx0 = Math.floor((minX - 1e-7) / cellSize);
    const gx1 = Math.floor((maxX + 1e-7) / cellSize);
    const gy0 = Math.floor((minY - 1e-7) / cellSize);
    const gy1 = Math.floor((maxY + 1e-7) / cellSize);

    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const key = gx + ',' + gy;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(i);
      }
    }
  }

  // Check intersections only within same/adjacent cells
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);

    const gx0 = Math.floor((minX - 1e-7) / cellSize);
    const gx1 = Math.floor((maxX + 1e-7) / cellSize);
    const gy0 = Math.floor((minY - 1e-7) / cellSize);
    const gy1 = Math.floor((maxY + 1e-7) / cellSize);

    const candidates = new Set();
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const cell = grid.get(gx + ',' + gy);
        if (cell) for (const j of cell) if (j !== i) candidates.add(j);
      }
    }

    for (const j of candidates) {
      if (j === i || j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) {
        return false;
      }
    }
  }
  return true;
}

function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === (i + 1) % n || i === (j + 1) % n) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) ||
         (abD === 0 && onSegment(a, b, d)) ||
         (cdA === 0 && onSegment(c, d, a)) ||
         (cdB === 0 && onSegment(c, d, b));
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
         p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10 &&
         Math.abs(cross(a, b, p)) <= 1e-10;
}

export function triangulateRing(ring, context = {}) {
  return triangulateRingOptimized(ring, context);
}

export { SpatialGrid, pointInTriangle, signedArea, cross, normalizeRing, unwrapRing, estimateCellSize, isSimpleOptimized, segmentsIntersect, onSegment, isSimple, same, squaredDistance };
