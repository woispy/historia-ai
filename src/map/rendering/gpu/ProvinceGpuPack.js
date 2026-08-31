/** Deterministic indexed GPU province geometry. HMAP/GIS remains authoritative. */
const EPSILON = 1e-10;
const COLLINEAR_EPSILON = 1e-12;

const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

const samePoint = (a, b) =>
  Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON;

export function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const key = `${Math.round(p[0] / EPSILON)},${Math.round(p[1] / EPSILON)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  if (out.length > 1 && samePoint(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 2) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (Math.abs(cross(a, b, c)) <= COLLINEAR_EPSILON * scale) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return out;
}

function orientation(a, b, c) {
  const value = cross(a, b, c);
  if (value > EPSILON) return 1;
  if (value < -EPSILON) return -1;
  return 0;
}

function onSegment(a, b, p) {
  if (orientation(a, b, p) !== 0) return false;
  return (
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

function segmentsIntersect(a, b, c, d) {
  const ab1 = orientation(a, b, c);
  const ab2 = orientation(a, b, d);
  const cd1 = orientation(c, d, a);
  const cd2 = orientation(c, d, b);
  if (ab1 !== ab2 && cd1 !== cd2) return true;
  return (
    (ab1 === 0 && onSegment(a, b, c)) ||
    (ab2 === 0 && onSegment(a, b, d)) ||
    (cd1 === 0 && onSegment(c, d, a)) ||
    (cd2 === 0 && onSegment(c, d, b))
  );
}

function diagonalClear(points, active, a, b) {
  const pa = points[a];
  const pb = points[b];
  for (let i = 0; i < active.length; i += 1) {
    const u = active[i];
    const v = active[(i + 1) % active.length];
    if (u === a || u === b || v === a || v === b) continue;
    if (segmentsIntersect(pa, pb, points[u], points[v])) return false;
  }
  return true;
}

function pointInTriangleInclusive(p, a, b, c) {
  const x = cross(a, b, p);
  const y = cross(b, c, p);
  const z = cross(c, a, p);
  const hasPositive = x > EPSILON || y > EPSILON || z > EPSILON;
  const hasNegative = x < -EPSILON || y < -EPSILON || z < -EPSILON;
  return !(hasPositive && hasNegative);
}

function earClip(points) {
  const active = Array.from({ length: points.length }, (_, i) => i);
  if (signedArea(points) < 0) active.reverse();
  const triangles = [];
  let guard = 0;
  const maxIterations = Math.max(32, points.length * points.length * 4);

  while (active.length > 3 && guard++ < maxIterations) {
    let found = -1;
    for (let i = 0; i < active.length; i += 1) {
      const prev = active[(i - 1 + active.length) % active.length];
      const curr = active[i];
      const next = active[(i + 1) % active.length];
      const turn = cross(points[prev], points[curr], points[next]);
      if (turn <= EPSILON) continue;
      if (!diagonalClear(points, active, prev, next)) continue;

      let blocked = false;
      for (const candidate of active) {
        if (candidate === prev || candidate === curr || candidate === next) continue;
        if (
          pointInTriangleInclusive(
            points[candidate],
            points[prev],
            points[curr],
            points[next],
          )
        ) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        found = i;
        break;
      }
    }

    if (found < 0) return null;
    const prev = active[(found - 1 + active.length) % active.length];
    const curr = active[found];
    const next = active[(found + 1) % active.length];
    triangles.push(prev, curr, next);
    active.splice(found, 1);
  }

  if (active.length !== 3) return null;
  if (cross(points[active[0]], points[active[1]], points[active[2]]) <= EPSILON) return null;
  triangles.push(active[0], active[1], active[2]);
  return triangles.length === (points.length - 2) * 3 ? triangles : null;
}

function findSplit(points) {
  const active = Array.from({ length: points.length }, (_, i) => i);
  const candidates = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 2; j < active.length; j += 1) {
      if (i === 0 && j === active.length - 1) continue;
      if (diagonalClear(points, active, active[i], active[j])) {
        candidates.push([active[i], active[j]]);
      }
    }
  }
  candidates.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return candidates[0] ?? null;
}

function decompose(points) {
  const split = findSplit(points);
  if (!split) return null;
  const [first, second] = split;
  const lo = Math.min(first, second);
  const hi = Math.max(first, second);
  const left = points.slice(lo, hi + 1);
  const right = [...points.slice(hi), ...points.slice(0, lo + 1)];
  if (left.length < 3 || right.length < 3) return null;

  const leftTriangles = earClip(left);
  const rightTriangles = earClip(right);
  if (!leftTriangles || !rightTriangles) return null;

  const rightOffset = hi;
  const rightWrap = points.length - hi;
  const remapRight = rightTriangles.map((index) =>
    index < rightWrap ? rightOffset + index : index - rightWrap + lo,
  );
  return [
    ...leftTriangles.map((index) => lo + index),
    ...remapRight,
  ];
}

export function triangulateRing(ring, context = {}) {
  const points = normalizeRing(ring);
  if (points.length < 3) return [];
  const area = signedArea(points);
  if (Math.abs(area) <= EPSILON) {
    throw new Error(
      `Degenerate province ring${context.provinceId ? ` for ${context.provinceId}` : ""}`,
    );
  }

  const result = earClip(points) || decompose(points);
  if (!result) {
    const id = context.provinceId ? ` province=${context.provinceId}` : "";
    const lod = context.lod === undefined ? "" : ` lod=${context.lod}`;
    throw new Error(`Province triangulation failed${id}${lod}; vertices=${points.length}`);
  }
  return result;
}

function simplifyRing(ring, target) {
  const points = normalizeRing(ring);
  if (points.length <= target || target < 3) return points;
  const out = [];
  for (let i = 0; i < target; i += 1) {
    out.push(points[Math.min(points.length - 1, Math.round(i * (points.length - 1) / Math.max(1, target - 1)))]);
  }
  return normalizeRing(out);
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const points = normalizeRing(ring);
  return levels.map((factor, level) =>
    simplifyRing(
      points,
      Math.min(points.length, Math.max(level === levels.length - 1 ? 3 : 4, Math.round(points.length * factor))),
    ),
  );
}

const quantizedKey = (point, scale) =>
  `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`;

export function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10);
  const quantization = Number(options.quantization ?? 1e6);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new Error("Invalid tile size");
  if (!Number.isFinite(quantization) || quantization <= 0) throw new Error("Invalid quantization");

  const vertices = [];
  const indices = [];
  const vertexMap = new Map();
  const provinces = [];
  const tiles = new Map();

  const vertexIndex = (point) => {
    const key = quantizedKey(point, quantization);
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const index = vertices.length / 2;
    vertices.push(point[0], point[1]);
    vertexMap.set(key, index);
    return index;
  };

  entries.forEach((entry, provinceIndex) => {
    const id = String(entry?.province?.id ?? entry?.id ?? provinceIndex);
    const polygons = entry?.geometry?.polygons ?? entry?.polygons ?? [];
    const lodRanges = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (const polygon of polygons) {
        const ring = buildLodRings(polygon)[lod];
        if (ring.length < 3) continue;
        for (const point of ring) {
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          maxX = Math.max(maxX, point[0]);
          maxY = Math.max(maxY, point[1]);
        }
        for (const index of triangulateRing(ring, { provinceId: id, lod })) {
          indices.push(vertexIndex(ring[index]));
        }
      }
      const indexCount = indices.length - firstIndex;
      if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${id}`);
      lodRanges.push(Object.freeze({ firstIndex, indexCount }));
    }

    const bounds = Number.isFinite(minX)
      ? Object.freeze({ minX, minY, maxX, maxY })
      : null;
    provinces.push(
      Object.freeze({
        provinceIndex,
        provinceId: id,
        bounds,
        lodRanges: Object.freeze(lodRanges),
      }),
    );

    if (bounds) {
      for (let x = Math.floor(bounds.minX / tileSize); x <= Math.floor(bounds.maxX / tileSize); x += 1) {
        for (let y = Math.floor(bounds.minY / tileSize); y <= Math.floor(bounds.maxY / tileSize); y += 1) {
          const tileId = `${x}:${y}`;
          if (!tiles.has(tileId)) tiles.set(tileId, { tileId, x, y, provinceIndices: [] });
          tiles.get(tileId).provinceIndices.push(provinceIndex);
        }
      }
    }
  });

  return Object.freeze({
    version: 2,
    tileSize,
    quantization,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    provinces: Object.freeze(provinces),
    tiles: Object.freeze(
      [...tiles.values()].map((tile) =>
        Object.freeze({
          ...tile,
          provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)),
        }),
      ),
    ),
  });
}
