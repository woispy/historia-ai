/**
 * Deterministic, indexed GPU geometry pack.
 * HMAP remains authoritative; this is a derived render representation only.
 */
const EPSILON = 1e-10;
const COLLINEAR_EPSILON = 1e-12;

function samePoint(a, b) { return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON; }
function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function signedArea(ring) { let sum = 0; for (let i = 0; i < ring.length; i += 1) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; sum += a[0] * b[1] - b[0] * a[1]; } return sum / 2; }

function normalizeIndexedRing(ring) {
  if (!Array.isArray(ring)) return [];
  const out = [];
  const seen = new Map();
  ring.forEach((point, originalIndex) => {
    if (!Array.isArray(point) || point.length < 2) return;
    const x = Number(point[0]); const y = Number(point[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const p = [x, y];
    const key = `${Math.round(x / EPSILON)},${Math.round(y / EPSILON)}`;
    if (seen.has(key)) return;
    seen.set(key, true);
    out.push({ point: p, originalIndex });
  });
  if (out.length > 1 && samePoint(out[0].point, out[out.length - 1].point)) out.pop();
  return out;
}
export function normalizeRing(ring) { return normalizeIndexedRing(ring).map(({ point }) => point); }

function removeCollinearIndexed(points) {
  const out = points.slice();
  if (out.length <= 3) return out;
  let changed = true; let guard = 0;
  while (changed && out.length > 3 && guard <= out.length * 2) {
    changed = false; guard += 1;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const prev = out[(i - 1 + out.length) % out.length].point; const current = out[i].point; const next = out[(i + 1) % out.length].point;
      const scale = Math.max(1, Math.hypot(next[0] - prev[0], next[1] - prev[1]));
      if (Math.abs(cross(prev, current, next)) <= COLLINEAR_EPSILON * scale) { out.splice(i, 1); changed = true; i -= 1; }
    }
  }
  return out;
}
function pointOnSegment(p, a, b) {
  if (Math.abs(cross(a, b, p)) > EPSILON) return false;
  return p[0] >= Math.min(a[0], b[0]) - EPSILON && p[0] <= Math.max(a[0], b[0]) + EPSILON && p[1] >= Math.min(a[1], b[1]) - EPSILON && p[1] <= Math.max(a[1], b[1]) + EPSILON;
}
function pointInPolygon(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]; const b = ring[j];
    if (pointOnSegment(p, a, b)) return true;
    if ((a[1] > p[1]) !== (b[1] > p[1])) { const x = ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]; if (p[0] < x) inside = !inside; }
  }
  return inside;
}
function pointStrictlyInsideTriangle(p, a, b, c) {
  const ab = cross(a, b, p); const bc = cross(b, c, p); const ca = cross(c, a, p);
  return (ab > EPSILON && bc > EPSILON && ca > EPSILON) || (ab < -EPSILON && bc < -EPSILON && ca < -EPSILON);
}
function segmentsProperlyIntersect(a, b, c, d) {
  const abC = cross(a, b, c); const abD = cross(a, b, d); const cdA = cross(c, d, a); const cdB = cross(c, d, b);
  return ((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) && ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON));
}
function diagonalIsValid(points, remaining, ia, ib) {
  const a = points[ia].point; const b = points[ib].point;
  if (!pointInPolygon([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], remaining.map((index) => points[index].point))) return false;
  for (let i = 0; i < remaining.length; i += 1) {
    const ea = remaining[i]; const eb = remaining[(i + 1) % remaining.length];
    if (ea === ia || ea === ib || eb === ia || eb === ib) continue;
    if (segmentsProperlyIntersect(a, b, points[ea].point, points[eb].point)) return false;
  }
  return true;
}
function triangleIsValid(points, remaining, ia, ib, ic) {
  const a = points[ia].point; const b = points[ib].point; const c = points[ic].point;
  if (cross(a, b, c) <= EPSILON || !diagonalIsValid(points, remaining, ia, ic)) return false;
  for (const candidate of remaining) if (candidate !== ia && candidate !== ib && candidate !== ic && pointStrictlyInsideTriangle(points[candidate].point, a, b, c)) return false;
  return true;
}
function findDeterministicDiagonal(points, remaining) {
  const candidates = [];
  for (let ai = 0; ai < remaining.length; ai += 1) for (let bi = ai + 2; bi < remaining.length; bi += 1) {
    if (ai === 0 && bi === remaining.length - 1) continue;
    const a = remaining[ai]; const b = remaining[bi];
    if (diagonalIsValid(points, remaining, a, b)) candidates.push([a, b]);
  }
  candidates.sort((a, b) => { const amin = Math.min(a[0], a[1]); const bmin = Math.min(b[0], b[1]); if (amin !== bmin) return amin - bmin; return Math.max(a[0], a[1]) - Math.max(b[0], b[1]); });
  return candidates[0] ?? null;
}
function triangulateByDecomposition(points, remaining, context) {
  const diagonal = findDeterministicDiagonal(points, remaining);
  if (!diagonal) return null;
  const ai = remaining.indexOf(diagonal[0]); const bi = remaining.indexOf(diagonal[1]);
  const first = remaining.slice(Math.min(ai, bi), Math.max(ai, bi) + 1);
  const second = [...remaining.slice(Math.max(ai, bi)), ...remaining.slice(0, Math.min(ai, bi) + 1)];
  if (first.length < 3 || second.length < 3) return null;
  const left = triangulateNormalized(points, first, context); const right = triangulateNormalized(points, second, context);
  return left && right ? [...left, ...right] : null;
}
function triangulateNormalized(points, remaining, context) {
  if (remaining.length < 3) return [];
  if (remaining.length === 3) {
    const [a, b, c] = remaining;
    return cross(points[a].point, points[b].point, points[c].point) > EPSILON ? [points[a].originalIndex, points[b].originalIndex, points[c].originalIndex] : null;
  }
  for (let i = 0; i < remaining.length; i += 1) {
    const ia = remaining[(i - 1 + remaining.length) % remaining.length]; const ib = remaining[i]; const ic = remaining[(i + 1) % remaining.length];
    if (!triangleIsValid(points, remaining, ia, ib, ic)) continue;
    const next = remaining.slice(); next.splice(i, 1);
    const tail = triangulateNormalized(points, next, context);
    if (tail) return [points[ia].originalIndex, points[ib].originalIndex, points[ic].originalIndex, ...tail];
  }
  return triangulateByDecomposition(points, remaining, context);
}
export function triangulateRing(ring, context = {}) {
  const normalized = removeCollinearIndexed(normalizeIndexedRing(ring));
  if (normalized.length < 3) return [];
  const signed = signedArea(normalized.map(({ point }) => point));
  if (Math.abs(signed) <= EPSILON) throw new Error(`Degenerate province ring${context.provinceId ? ` for ${context.provinceId}` : ""}`);
  const points = signed > 0 ? normalized : [...normalized].reverse();
  const result = triangulateNormalized(points, points.map((_, i) => i), context);
  if (!result) { const province = context.provinceId ? ` province=${context.provinceId}` : ""; const lod = context.lod === undefined ? "" : ` lod=${context.lod}`; throw new Error(`Province triangulation failed${province}${lod}; vertices=${points.length}`); }
  return result;
}
function simplifyRing(ring, targetCount) {
  const normalized = normalizeRing(ring); if (normalized.length <= targetCount || targetCount < 3) return normalized;
  const keep = new Set([0, normalized.length - 1]); const stride = (normalized.length - 2) / Math.max(1, targetCount - 2);
  for (let i = 1; i < targetCount - 1; i += 1) keep.add(Math.min(normalized.length - 2, Math.round(i * stride)));
  return normalizeRing([...keep].sort((a, b) => a - b).map((i) => normalized[i]));
}
export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) { const normalized = normalizeRing(ring); return levels.map((factor, level) => simplifyRing(normalized, Math.min(normalized.length, Math.max(level === levels.length - 1 ? 3 : 4, Math.round(normalized.length * factor))))); }
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
      for (const polygon of polygons) { const ring = buildLodRings(polygon)[lod]; if (ring.length < 3) continue; for (const point of ring) { minX = Math.min(minX, point[0]); minY = Math.min(minY, point[1]); maxX = Math.max(maxX, point[0]); maxY = Math.max(maxY, point[1]); } const triangles = triangulateRing(ring, { provinceId: id, lod }); for (const localIndex of triangles) indices.push(getVertex(ring[localIndex])); }
      const indexCount = indices.length - firstIndex; if (indexCount % 3 !== 0) throw new Error(`LOD${lod} range is not triangle aligned for ${id}`); lodRanges.push(Object.freeze({ firstIndex, indexCount }));
    }
    const bounds = Number.isFinite(minX) ? Object.freeze({ minX, minY, maxX, maxY }) : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId: id, bounds, lodRanges: Object.freeze(lodRanges) }));
    if (bounds) { const minTileX = Math.floor(bounds.minX / tileSize); const maxTileX = Math.floor(bounds.maxX / tileSize); const minTileY = Math.floor(bounds.minY / tileSize); const maxTileY = Math.floor(bounds.maxY / tileSize); for (let x = minTileX; x <= maxTileX; x += 1) for (let y = minTileY; y <= maxTileY; y += 1) { const key = `${x}:${y}`; if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] }); tiles.get(key).provinceIndices.push(provinceIndex); } }
  });
  const tileList = [...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }));
  return Object.freeze({ version: 2, tileSize, quantization, vertices: new Float32Array(vertices), indices: new Uint32Array(indices), provinces: Object.freeze(provinces), tiles: Object.freeze(tileList) });
}
