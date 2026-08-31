/** Deterministic indexed GPU province geometry compiler. HMAP/GIS remains authoritative. */

const EPSILON = 1e-10;
const COLLINEAR_EPSILON = 1e-10;
const MAX_LOD0_VERTICES = 512;
const DEFAULT_MAX_OPERATIONS = 250_000;

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

const operation = (state, amount = 1) => {
  state.operations += amount;
  if (state.operations > state.maxOperations) {
    const error = new Error(`GPU triangulation operation budget exceeded; operations=${state.operations}; limit=${state.maxOperations}`);
    error.code = "GPU_TRIANGULATION_BUDGET";
    throw error;
  }
};

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

function orient(a, b, c) {
  const value = cross(a, b, c);
  if (Math.abs(value) <= EPSILON) return 0;
  return value > 0 ? 1 : -1;
}

function onSegment(a, b, p) {
  return (
    orient(a, b, p) === 0 &&
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

function properCross(a, b, c, d) {
  const abC = orient(a, b, c);
  const abD = orient(a, b, d);
  const cdA = orient(c, d, a);
  const cdB = orient(c, d, b);
  if (abC && abD && cdA && cdB) return abC !== abD && cdA !== cdB;
  if (abC === 0 && abD === 0 && cdA === 0 && cdB === 0) {
    const useX = Math.abs(a[0] - b[0]) >= Math.abs(a[1] - b[1]);
    const a0 = useX ? a[0] : a[1];
    const a1 = useX ? b[0] : b[1];
    const c0 = useX ? c[0] : c[1];
    const c1 = useX ? d[0] : d[1];
    return Math.min(a0, a1) < Math.max(c0, c1) - EPSILON &&
      Math.min(c0, c1) < Math.max(a0, a1) - EPSILON;
  }
  if (abC === 0 && onSegment(a, b, c)) return !same(c, a) && !same(c, b);
  if (abD === 0 && onSegment(a, b, d)) return !same(d, a) && !same(d, b);
  if (cdA === 0 && onSegment(c, d, a)) return !same(a, c) && !same(a, d);
  if (cdB === 0 && onSegment(c, d, b)) return !same(b, c) && !same(b, d);
  return false;
}

function isSimple(ring, state) {
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    for (let j = i + 1; j < ring.length; j += 1) {
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      operation(state);
      if (properCross(a, b, ring[j], ring[(j + 1) % ring.length])) return false;
    }
  }
  return true;
}

function pointInPolygon(point, points, ids) {
  let inside = false;
  for (let i = 0, j = ids.length - 1; i < ids.length; j = i++) {
    const a = points[ids[i]];
    const b = points[ids[j]];
    if (onSegment(a, b, point)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1])) {
      const x = ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPSILON) + a[0];
      if (point[0] < x) inside = !inside;
    }
  }
  return inside;
}

function diagonalClear(points, ids, a, b, state) {
  for (let i = 0; i < ids.length; i += 1) {
    const u = ids[i];
    const v = ids[(i + 1) % ids.length];
    if (u === a || u === b || v === a || v === b) continue;
    operation(state);
    if (properCross(points[a], points[b], points[u], points[v])) return false;
  }
  return pointInPolygon(
    [(points[a][0] + points[b][0]) / 2, (points[a][1] + points[b][1]) / 2],
    points,
    ids,
  );
}

function strictlyInsideTriangle(p, a, b, c) {
  const x = cross(a, b, p);
  const y = cross(b, c, p);
  const z = cross(c, a, p);
  return (x > EPSILON && y > EPSILON && z > EPSILON) ||
    (x < -EPSILON && y < -EPSILON && z < -EPSILON);
}

function isConvex(points) {
  let sign = 0;
  for (let i = 0; i < points.length; i += 1) {
    const value = cross(points[i], points[(i + 1) % points.length], points[(i + 2) % points.length]);
    if (Math.abs(value) <= EPSILON) continue;
    const next = value > 0 ? 1 : -1;
    if (sign && sign !== next) return false;
    sign = next;
  }
  return sign !== 0;
}

function fanTriangulate(points, ids) {
  const ordered = signedArea(ids.map((id) => points[id])) < 0 ? ids.slice().reverse() : ids.slice();
  const out = [];
  for (let i = 1; i < ordered.length - 1; i += 1) out.push(ordered[0], ordered[i], ordered[i + 1]);
  return out;
}

function earClip(points, inputIds, state) {
  const ids = inputIds.slice();
  if (signedArea(ids.map((id) => points[id])) < 0) ids.reverse();
  const remaining = ids.slice();
  const out = [];
  const guardLimit = ids.length * ids.length * 4;
  let guard = 0;

  while (remaining.length > 3) {
    if (++guard > guardLimit) {
      const error = new Error(`GPU triangulation guard exceeded; vertices=${ids.length}`);
      error.code = "GPU_TRIANGULATION_GUARD";
      throw error;
    }
    let found = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const a = remaining[(i - 1 + remaining.length) % remaining.length];
      const b = remaining[i];
      const c = remaining[(i + 1) % remaining.length];
      if (cross(points[a], points[b], points[c]) <= EPSILON) continue;
      if (!diagonalClear(points, remaining, a, c, state)) continue;
      let blocked = false;
      for (const k of remaining) {
        if (k === a || k === b || k === c) continue;
        operation(state);
        if (strictlyInsideTriangle(points[k], points[a], points[b], points[c])) {
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

function decompose(points, ids, state, depth = 0) {
  if (ids.length < 3) return null;
  if (depth > ids.length * 2) return null;
  const clipped = earClip(points, ids, state);
  if (clipped) return clipped;

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 2; j < ids.length; j += 1) {
      if (i === 0 && j === ids.length - 1) continue;
      operation(state);
      const a = ids[i];
      const b = ids[j];
      if (!diagonalClear(points, ids, a, b, state)) continue;
      const split = splitIds(ids, a, b);
      if (!split) continue;
      const left = decompose(points, split[0], state, depth + 1);
      if (!left) continue;
      const right = decompose(points, split[1], state, depth + 1);
      if (right) return [...left, ...right];
    }
  }
  return null;
}

export function triangulateRing(ring, context = {}) {
  const points = normalizeRing(ring);
  if (points.length < 3) return [];
  const state = {
    operations: 0,
    maxOperations: Number(context.maxOperations ?? DEFAULT_MAX_OPERATIONS),
  };
  if (!Number.isFinite(state.maxOperations) || state.maxOperations < 1) {
    throw new Error("Invalid GPU triangulation operation budget");
  }
  if (Math.abs(signedArea(points)) <= EPSILON) {
    throw new Error(`Degenerate province ring${context.provinceId ? ` province=${context.provinceId}` : ""}${context.lod === undefined ? "" : ` lod=${context.lod}`}`);
  }

  if (isConvex(points)) return fanTriangulate(points, Array.from({ length: points.length }, (_, i) => i));

  const simple = isSimple(points, state);
  if (!simple) {
    const id = context.provinceId ? ` province=${context.provinceId}` : "";
    const polygon = context.polygonIndex === undefined ? "" : ` polygon=${context.polygonIndex}`;
    const lod = context.lod === undefined ? "" : ` lod=${context.lod}`;
    const error = new Error(`GPU topology is self-intersecting${id}${polygon}${lod}; vertices=${points.length}; operations=${state.operations}`);
    error.code = "GPU_SELF_INTERSECTION";
    throw error;
  }

  const ids = Array.from({ length: points.length }, (_, i) => i);
  const result = earClip(points, ids, state) || decompose(points, ids, state);
  if (!result) {
    const id = context.provinceId ? ` province=${context.provinceId}` : "";
    const polygon = context.polygonIndex === undefined ? "" : ` polygon=${context.polygonIndex}`;
    const lod = context.lod === undefined ? "" : ` lod=${context.lod}`;
    const error = new Error(`GPU triangulation failed${id}${polygon}${lod}; vertices=${points.length}; operations=${state.operations}`);
    error.code = "GPU_TRIANGULATION_FAILED";
    throw error;
  }
  return result;
}

function simplifyRing(ring, target) {
  const points = normalizeRing(ring);
  if (points.length <= target || target < 3) return points;
  let currentTarget = target;
  for (let pass = 0; pass < 6; pass += 1) {
    const step = points.length / currentTarget;
    const candidate = [];
    for (let i = 0; i < currentTarget; i += 1) {
      candidate.push(points[Math.min(points.length - 1, Math.floor(i * step))]);
    }
    const normalized = normalizeRing(candidate);
    if (normalized.length >= 3) {
      try {
        triangulateRing(normalized, { maxOperations: 100_000 });
        return normalized;
      } catch {
        // Deterministically reduce the candidate until it is triangulable.
      }
    }
    currentTarget = Math.max(3, Math.floor(currentTarget * 0.75));
  }
  return points;
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const points = normalizeRing(ring);
  return levels.map((factor, level) => {
    const target = Math.min(
      points.length,
      Math.max(level === 0 ? Math.min(MAX_LOD0_VERTICES, points.length) : 3, Math.round(points.length * factor)),
    );
    return simplifyRing(points, target);
  });
}

const qkey = (point, scale) => `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`;

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
  const vertex = (point) => {
    const key = qkey(point, quantization);
    const old = vertexMap.get(key);
    if (old !== undefined) return old;
    const index = vertices.length / 2;
    vertices.push(point[0], point[1]);
    vertexMap.set(key, index);
    return index;
  };

  entries.forEach((entry, provinceIndex) => {
    const provinceId = String(entry?.province?.id ?? entry?.id ?? provinceIndex);
    const polygons = entry?.geometry?.polygons ?? entry?.polygons ?? [];
    const lodRanges = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (const [polygonIndex, polygon] of polygons.entries()) {
        const ring = buildLodRings(polygon)[lod];
        if (ring.length < 3) continue;
        for (const point of ring) {
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          maxX = Math.max(maxX, point[0]);
          maxY = Math.max(maxY, point[1]);
        }
        const triangles = triangulateRing(ring, { provinceId, polygonIndex, lod });
        for (const index of triangles) indices.push(vertex(ring[index]));
      }
      const indexCount = indices.length - firstIndex;
      if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${provinceId}`);
      lodRanges.push(Object.freeze({ firstIndex, indexCount }));
    }

    const bounds = Number.isFinite(minX) ? Object.freeze({ minX, minY, maxX, maxY }) : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId, bounds, lodRanges: Object.freeze(lodRanges) }));
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
      [...tiles.values()].map((tile) => Object.freeze({
        ...tile,
        provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)),
      })),
    ),
  });
}
