/**
 * Deterministic, indexed GPU geometry pack.
 * HMAP remains authoritative; this is a derived render representation only.
 */
const EPSILON = 1e-10;
const COLLINEAR_EPSILON = 1e-12;

function samePoint(a, b) { return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON; }

export function normalizeRing(ring) {
  if (!Array.isArray(ring)) return [];
  const out = [];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const x = Number(point[0]); const y = Number(point[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const p = [x, y];
    if (!out.length || !samePoint(out[out.length - 1], p)) out.push(p);
  }
  if (out.length > 1 && samePoint(out[0], out[out.length - 1])) out.pop();
  return out;
}

function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; sum += a[0] * b[1] - b[0] * a[1]; }
  return sum / 2;
}

function removeCollinearVertices(ring) {
  const points = normalizeRing(ring);
  if (points.length <= 3) return points;
  let changed = true;
  let guard = 0;
  while (changed && points.length > 3 && guard <= points.length * 2) {
    changed = false;
    guard += 1;
    for (let i = 0; i < points.length && points.length > 3; i += 1) {
      const prev = points[(i - 1 + points.length) % points.length];
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const scale = Math.max(1, Math.hypot(next[0] - prev[0], next[1] - prev[1]));
      if (Math.abs(cross(prev, current, next)) <= COLLINEAR_EPSILON * scale) {
        points.splice(i, 1);
        changed = true;
        i -= 1;
      }
    }
  }
  return points;
}

function pointStrictlyInsideTriangle(p, a, b, c) {
  const ab = cross(a, b, p); const bc = cross(b, c, p); const ca = cross(c, a, p);
  return (ab > EPSILON && bc > EPSILON && ca > EPSILON) || (ab < -EPSILON && bc < -EPSILON && ca < -EPSILON);
}

function segmentCrossesInterior(a, b, c, d) {
  const abC = cross(a, b, c); const abD = cross(a, b, d); const cdA = cross(c, d, a); const cdB = cross(c, d, b);
  return ((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
    ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON));
}

function isValidEar(points, remaining, i) {
  const ia = remaining[(i - 1 + remaining.length) % remaining.length];
  const ib = remaining[i];
  const ic = remaining[(i + 1) % remaining.length];
  const a = points[ia]; const b = points[ib]; const c = points[ic];
  if (cross(a, b, c) <= EPSILON) return false;
  for (const candidate of remaining) {
    if (candidate === ia || candidate === ib || candidate === ic) continue;
    if (pointStrictlyInsideTriangle(points[candidate], a, b, c)) return false;
  }
  for (let edgeIndex = 0; edgeIndex < remaining.length; edgeIndex += 1) {
    const ea = remaining[edgeIndex]; const eb = remaining[(edgeIndex + 1) % remaining.length];
    if (ea === ia || ea === ib || ea === ic || eb === ia || eb === ib || eb === ic) continue;
    if (segmentCrossesInterior(a, c, points[ea], points[eb])) return false;
  }
  return true;
}

export function triangulateRing(ring, context = {}) {
  const normalized = removeCollinearVertices(ring);
  if (normalized.length < 3) return [];
  const signed = signedArea(normalized);
  if (Math.abs(signed) <= EPSILON) throw new Error(`Degenerate province ring${context.provinceId ? ` for ${context.provinceId}` : ""}`);
  const points = signed > 0 ? normalized : [...normalized].reverse();
  const source = signed > 0 ? points.map((_, i) => i) : points.map((_, i) => normalized.length - 1 - i);
  const remaining = points.map((_, i) => i); const result = [];
  let guard = 0;
  while (remaining.length > 3) {
    let clipped = false;
    for (let i = 0; i < remaining.length; i += 1) {
      if (!isValidEar(points, remaining, i)) continue;
      const ia = remaining[(i - 1 + remaining.length) % remaining.length];
      const ib = remaining[i];
      const ic = remaining[(i + 1) % remaining.length];
      result.push(source[ia], source[ib], source[ic]);
      remaining.splice(i, 1);
      clipped = true;
      break;
    }
    guard += 1;
    if (!clipped || guard > points.length * points.length) {
      const province = context.provinceId ? ` province=${context.provinceId}` : "";
      const lod = context.lod === undefined ? "" : ` lod=${context.lod}`;
      throw new Error(`Province triangulation failed${province}${lod}; vertices=${points.length}; remaining=${remaining.length}`);
    }
  }
  result.push(source[remaining[0]], source[remaining[1]], source[remaining[2]]);
  return result;
}

function simplifyRing(ring, targetCount) {
  const normalized = removeCollinearVertices(ring);
  if (normalized.length <= targetCount || targetCount < 3) return normalized;
  const keep = new Set([0, normalized.length - 1]);
  const stride = (normalized.length - 2) / Math.max(1, targetCount - 2);
  for (let i = 1; i < targetCount - 1; i += 1) keep.add(Math.min(normalized.length - 2, Math.round(i * stride)));
  return removeCollinearVertices([...keep].sort((a, b) => a - b).map((i) => normalized[i]));
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const normalized = normalizeRing(ring);
  return levels.map((factor, level) => simplifyRing(normalized, Math.min(normalized.length, Math.max(level === levels.length - 1 ? 3 : 4, Math.round(normalized.length * factor)))));
}

function quantizedKey(point, scale) { return `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`; }

export function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10); const quantization = Number(options.quantization ?? 1e6);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new Error("Invalid tile size");
  if (!Number.isFinite(quantization) || quantization <= 0) throw new Error("Invalid quantization");
  const vertices = []; const indices = []; const vertexMap = new Map(); const provinces = []; const tiles = new Map();
  const getVertex = (point) => { const key = quantizedKey(point, quantization); const existing = vertexMap.get(key); if (existing !== undefined) return existing; const index = vertices.length / 2; vertices.push(point[0], point[1]); vertexMap.set(key, index); return index; };
  entries.forEach((entry, provinceIndex) => {
    const id = String(entry?.province?.id ?? entry?.id ?? provinceIndex); const polygons = entry?.geometry?.polygons ?? entry?.polygons ?? [];
    const lodRanges = []; let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (const polygon of polygons) {
        const ring = buildLodRings(polygon)[lod]; if (ring.length < 3) continue;
        for (const point of ring) { minX = Math.min(minX, point[0]); minY = Math.min(minY, point[1]); maxX = Math.max(maxX, point[0]); maxY = Math.max(maxY, point[1]); }
        const triangles = triangulateRing(ring, { provinceId: id, lod });
        for (const localIndex of triangles) indices.push(getVertex(ring[localIndex]));
      }
      const indexCount = indices.length - firstIndex; if (indexCount % 3 !== 0) throw new Error(`LOD${lod} range is not triangle aligned for ${id}`);
      lodRanges.push(Object.freeze({ firstIndex, indexCount }));
    }
    const bounds = Number.isFinite(minX) ? Object.freeze({ minX, minY, maxX, maxY }) : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId: id, bounds, lodRanges: Object.freeze(lodRanges) }));
    if (bounds) {
      const minTileX = Math.floor(bounds.minX / tileSize); const maxTileX = Math.floor(bounds.maxX / tileSize); const minTileY = Math.floor(bounds.minY / tileSize); const maxTileY = Math.floor(bounds.maxY / tileSize);
      for (let x = minTileX; x <= maxTileX; x += 1) for (let y = minTileY; y <= maxTileY; y += 1) { const key = `${x}:${y}`; if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] }); tiles.get(key).provinceIndices.push(provinceIndex); }
    }
  });
  const tileList = [...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }));
  return Object.freeze({ version: 2, tileSize, quantization, vertices: new Float32Array(vertices), indices: new Uint32Array(indices), provinces: Object.freeze(provinces), tiles: Object.freeze(tileList) });
}
