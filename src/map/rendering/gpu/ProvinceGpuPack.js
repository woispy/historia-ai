/**
 * Deterministic, indexed GPU geometry pack.
 *
 * The HMAP geometry remains authoritative. This module only creates a derived
 * render representation: shared vertices, Uint32 indices, per-province LOD
 * ranges and tile metadata. No rasterization is involved.
 */

const EPSILON = 1e-10;

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON;
}

export function normalizeRing(ring) {
  if (!Array.isArray(ring)) return [];
  const out = [];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const x = Number(point[0]);
    const y = Number(point[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const next = [x, y];
    if (!out.length || !samePoint(out[out.length - 1], next)) out.push(next);
  }
  if (out.length > 1 && samePoint(out[0], out[out.length - 1])) out.pop();
  return out;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function area(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function inside(p, a, b, c) {
  const x = cross(a, b, p);
  const y = cross(b, c, p);
  const z = cross(c, a, p);
  return !(x < -EPSILON || y < -EPSILON || z < -EPSILON)
    || !(x > EPSILON || y > EPSILON || z > EPSILON);
}

export function triangulateRing(ring) {
  const normalized = normalizeRing(ring);
  if (normalized.length < 3) return [];
  if (Math.abs(area(normalized)) <= EPSILON) throw new Error("Degenerate province ring");
  const points = area(normalized) > 0 ? normalized : [...normalized].reverse();
  const source = area(normalized) > 0
    ? points.map((_, i) => i)
    : points.map((_, i) => normalized.length - 1 - i);
  const remaining = points.map((_, i) => i);
  const result = [];
  let guard = 0;
  while (remaining.length > 3) {
    let clipped = false;
    for (let i = 0; i < remaining.length; i += 1) {
      const ia = remaining[(i - 1 + remaining.length) % remaining.length];
      const ib = remaining[i];
      const ic = remaining[(i + 1) % remaining.length];
      const a = points[ia];
      const b = points[ib];
      const c = points[ic];
      if (cross(a, b, c) <= EPSILON) continue;
      let blocked = false;
      for (const candidate of remaining) {
        if (candidate === ia || candidate === ib || candidate === ic) continue;
        if (inside(points[candidate], a, b, c)) { blocked = true; break; }
      }
      if (blocked) continue;
      result.push(source[ia], source[ib], source[ic]);
      remaining.splice(i, 1);
      clipped = true;
      break;
    }
    guard += 1;
    if (!clipped || guard > points.length * points.length) throw new Error("Province triangulation failed");
  }
  result.push(source[remaining[0]], source[remaining[1]], source[remaining[2]]);
  return result;
}

function simplifyRing(ring, targetCount) {
  const normalized = normalizeRing(ring);
  if (normalized.length <= targetCount || targetCount < 3) return normalized;
  const keep = new Set([0, normalized.length - 1]);
  const stride = (normalized.length - 2) / Math.max(1, targetCount - 2);
  for (let i = 1; i < targetCount - 1; i += 1) keep.add(Math.min(normalized.length - 2, Math.round(i * stride)));
  return [...keep].sort((a, b) => a - b).map((i) => normalized[i]);
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const normalized = normalizeRing(ring);
  return levels.map((factor, level) => {
    const minimum = level === levels.length - 1 ? 3 : 4;
    const target = Math.max(minimum, Math.round(normalized.length * factor));
    return simplifyRing(normalized, Math.min(normalized.length, target));
  });
}

function quantizedKey(point, scale) {
  return `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`;
}

/** Build one deterministic indexed pack from province entries. */
export function buildIndexedProvincePack(entries, options = {}) {
  const tileSize = Number(options.tileSize ?? 10);
  const quantization = Number(options.quantization ?? 1e6);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new Error("Invalid tile size");
  const vertices = [];
  const indices = [];
  const vertexMap = new Map();
  const provinces = [];
  const tiles = new Map();

  const getVertex = (point) => {
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
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (const polygon of polygons) {
        const rings = buildLodRings(polygon);
        const ring = rings[lod];
        if (ring.length < 3) continue;
        for (const point of ring) {
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          maxX = Math.max(maxX, point[0]);
          maxY = Math.max(maxY, point[1]);
        }
        const triangles = triangulateRing(ring);
        for (let i = 0; i < triangles.length; i += 1) indices.push(getVertex(ring[triangles[i]]));
      }
      lodRanges.push({ firstIndex, indexCount: indices.length - firstIndex });
    }

    const bounds = Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId: id, bounds, lodRanges: Object.freeze(lodRanges) }));

    if (bounds) {
      const minTileX = Math.floor(bounds.minX / tileSize);
      const maxTileX = Math.floor(bounds.maxX / tileSize);
      const minTileY = Math.floor(bounds.minY / tileSize);
      const maxTileY = Math.floor(bounds.maxY / tileSize);
      for (let x = minTileX; x <= maxTileX; x += 1) {
        for (let y = minTileY; y <= maxTileY; y += 1) {
          const key = `${x}:${y}`;
          if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] });
          tiles.get(key).provinceIndices.push(provinceIndex);
        }
      }
    }
  });

  const tileList = [...tiles.values()].map((tile) => Object.freeze({
    ...tile,
    provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)),
  }));

  return Object.freeze({
    version: 2,
    tileSize,
    quantization,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    provinces: Object.freeze(provinces),
    tiles: Object.freeze(tileList),
  });
}
