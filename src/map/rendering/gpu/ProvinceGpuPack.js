/** Deterministic indexed GPU province geometry. HMAP/GIS remains authoritative. */
const EPSILON = 1e-10;
const COLLINEAR_EPSILON = 1e-10;

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
const same = (a, b) =>
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
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();

  let changed = true;
  let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 2) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const ac = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const scale = Math.max(1, ab, bc, ac);
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
  if (Math.abs(value) <= EPSILON) return 0;
  return value > 0 ? 1 : -1;
}

function onSegment(a, b, p) {
  return (
    orientation(a, b, p) === 0 &&
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (
    (abC === 0 && onSegment(a, b, c)) ||
    (abD === 0 && onSegment(a, b, d)) ||
    (cdA === 0 && onSegment(c, d, a)) ||
    (cdB === 0 && onSegment(c, d, b))
  );
}

function pointInPolygon(point, points, ids) {
  let inside = false;
  for (let i = 0, j = ids.length - 1; i < ids.length; j = i++) {
    const a = points[ids[i]];
    const b = points[ids[j]];
    if (onSegment(a, b, point)) return true;
    const crosses = (a[1] > point[1]) !== (b[1] > point[1]);
    if (crosses) {
      const x = ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0];
      if (point[0] < x) inside = !inside;
    }
  }
  return inside;
}

function diagonalClear(points, ids, ia, ib) {
  const a = points[ia];
  const b = points[ib];
  for (let i = 0; i < ids.length; i += 1) {
    const u = ids[i];
    const v = ids[(i + 1) % ids.length];
    if (u === ia || u === ib || v === ia || v === ib) continue;
    if (segmentsIntersect(a, b, points[u], points[v])) return false;
  }
  const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return pointInPolygon(midpoint, points, ids);
}

function strictlyInside(point, a, b, c) {
  const x = cross(a, b, point);
  const y = cross(b, c, point);
  const z = cross(c, a, point);
  return (
    (x > EPSILON && y > EPSILON && z > EPSILON) ||
    (x < -EPSILON && y < -EPSILON && z < -EPSILON)
  );
}

function earClip(points, inputIds = null) {
  const ids = inputIds ? inputIds.slice() : Array.from({ length: points.length }, (_, i) => i);
  if (signedArea(ids.map((id) => points[id])) < 0) ids.reverse();
  const remaining = ids.slice();
  const out = [];
  let guard = 0;

  while (remaining.length > 3 && guard++ < ids.length * ids.length * 4) {
    let found = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const a = remaining[(i - 1 + remaining.length) % remaining.length];
      const b = remaining[i];
      const c = remaining[(i + 1) % remaining.length];
      if (cross(points[a], points[b], points[c]) <= EPSILON) continue;
      if (!diagonalClear(points, remaining, a, c)) continue;
      let blocked = false;
      for (const k of remaining) {
        if (k !== a && k !== b && k !== c && strictlyInside(points[k], points[a], points[b], points[c])) {
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
    const a = remaining[(found - 1 + remaining.length) % remaining.length];
    const b = remaining[found];
    const c = remaining[(found + 1) % remaining.length];
    out.push(a, b, c);
    remaining.splice(found, 1);
  }

  if (remaining.length === 3 && cross(points[remaining[0]], points[remaining[1]], points[remaining[2]]) > EPSILON) {
    out.push(...remaining);
  }
  return out.length === (ids.length - 2) * 3 ? out : null;
}

function candidateDiagonals(points, ids) {
  const candidates = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 2; j < ids.length; j += 1) {
      if (i === 0 && j === ids.length - 1) continue;
      const a = ids[i];
      const b = ids[j];
      if (diagonalClear(points, ids, a, b)) candidates.push({ a, b, span: j - i });
    }
  }
  candidates.sort((x, y) => x.span - y.span || x.a - y.a || x.b - y.b);
  return candidates;
}

function splitIds(ids, a, b) {
  const ia = ids.indexOf(a);
  const ib = ids.indexOf(b);
  if (ia < 0 || ib < 0) return null;
  const first = [];
  for (let i = ia; ; i = (i + 1) % ids.length) {
    first.push(ids[i]);
    if (i === ib) break;
  }
  const second = [];
  for (let i = ib; ; i = (i + 1) % ids.length) {
    second.push(ids[i]);
    if (i === ia) break;
  }
  return first.length >= 3 && second.length >= 3 ? [first, second] : null;
}

function decompose(points, ids, depth = 0) {
  if (ids.length < 3 || depth > ids.length * 2) return null;
  const clipped = earClip(points, ids);
  if (clipped) return clipped;
  for (const diagonal of candidateDiagonals(points, ids)) {
    const split = splitIds(ids, diagonal.a, diagonal.b);
    if (!split) continue;
    const left = decompose(points, split[0], depth + 1);
    if (!left) continue;
    const right = decompose(points, split[1], depth + 1);
    if (right) return [...left, ...right];
  }
  return null;
}

export function triangulateRing(ring, context = {}) {
  const points = normalizeRing(ring);
  if (points.length < 3) return [];
  if (Math.abs(signedArea(points)) <= EPSILON) {
    throw new Error(`Degenerate province ring${context.provinceId ? ` for ${context.provinceId}` : ""}`);
  }
  const ids = Array.from({ length: points.length }, (_, i) => i);
  const result = earClip(points, ids) || decompose(points, ids);
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
    out.push(points[Math.min(points.length - 1, Math.round((i * (points.length - 1)) / Math.max(1, target - 1)))]);
  }
  return normalizeRing(out);
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const points = normalizeRing(ring);
  return levels.map((factor, level) =>
    simplifyRing(points, Math.min(points.length, Math.max(level === levels.length - 1 ? 3 : 4, Math.round(points.length * factor))))
  );
}

const qkey = (point, scale) => `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`;

export function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10);
  const quantization = Number(options.quantization ?? 1e6);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new Error("Invalid tile size");
  if (!Number.isFinite(quantization) || quantization <= 0) throw new Error("Invalid quantization");

  const vertices = [];
  const indices = [];
  const map = new Map();
  const provinces = [];
  const tiles = new Map();
  const vertex = (point) => {
    const key = qkey(point, quantization);
    const old = map.get(key);
    if (old !== undefined) return old;
    const index = vertices.length / 2;
    vertices.push(point[0], point[1]);
    map.set(key, index);
    return index;
  };

  entries.forEach((entry, provinceIndex) => {
    const id = String(entry?.province?.id ?? entry?.id ?? provinceIndex);
    const polygons = entry?.geometry?.polygons ?? entry?.polygons ?? [];
    const ranges = [];
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
        for (const index of triangulateRing(ring, { provinceId: id, lod })) indices.push(vertex(ring[index]));
      }
      const indexCount = indices.length - firstIndex;
      if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${id}`);
      ranges.push(Object.freeze({ firstIndex, indexCount }));
    }

    const bounds = Number.isFinite(minX) ? Object.freeze({ minX, minY, maxX, maxY }) : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId: id, bounds, lodRanges: Object.freeze(ranges) }));
    if (bounds) {
      for (let x = Math.floor(bounds.minX / tileSize); x <= Math.floor(bounds.maxX / tileSize); x += 1) {
        for (let y = Math.floor(bounds.minY / tileSize); y <= Math.floor(bounds.maxY / tileSize); y += 1) {
          const key = `${x}:${y}`;
          if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] });
          tiles.get(key).provinceIndices.push(provinceIndex);
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
        Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) })
      )
    ),
  });
}
