/** Stable deterministic polygon triangulation for historical GPU packing. */
const EPSILON = 1e-10;
const POSITION_EPSILON = 1e-7;
const COLLINEAR_EPSILON = 1e-12;
const MAX_TRIANGULATION_VERTICES = 12000;
const MAX_DIAGNOSTIC_INTERSECTIONS = 64;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const same = (a, b) => squaredDistance(a, b) <= POSITION_EPSILON ** 2;
const signedArea = (ring) => { let sum = 0; for (let i = 0; i < ring.length; i += 1) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; sum += a[0] * b[1] - b[0] * a[1]; } return sum / 2; };

export function normalizeRing(ring) {
  const out = []; const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / POSITION_EPSILON)},${Math.round(p[1] / POSITION_EPSILON)}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push(p);
  }
  if (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();
  let changed = true; let guard = 0;
  while (changed && out.length > 3 && guard++ < out.length * 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i += 1) {
      const a = out[(i - 1 + out.length) % out.length]; const b = out[i]; const c = out[(i + 1) % out.length];
      const scale = Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]));
      if (same(a, c) || squaredDistance(a, b) <= POSITION_EPSILON ** 2 || squaredDistance(b, c) <= POSITION_EPSILON ** 2 || Math.abs(cross(a, b, c)) <= COLLINEAR_EPSILON * scale) { out.splice(i, 1); changed = true; i -= 1; }
    }
  }
  return out;
}

function unwrapRing(points) {
  if (points.length < 2) return points.map((p) => p.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let x = points[i][0]; const previous = out[i - 1][0];
    while (x - previous > 180) x -= 360;
    while (x - previous < -180) x += 360;
    out.push([x, points[i][1]]);
  }
  return out;
}
function orientation(a, b, c) { const v = cross(a, b, c); return Math.abs(v) <= EPSILON ? 0 : v > 0 ? 1 : -1; }
function onSegment(a, b, p) { return orientation(a, b, p) === 0 && p[0] >= Math.min(a[0], b[0]) - EPSILON && p[0] <= Math.max(a[0], b[0]) + EPSILON && p[1] >= Math.min(a[1], b[1]) - EPSILON && p[1] <= Math.max(a[1], b[1]) + EPSILON; }
function segmentsIntersect(a, b, c, d) { const abC = orientation(a, b, c); const abD = orientation(a, b, d); const cdA = orientation(c, d, a); const cdB = orientation(c, d, b); if (abC !== abD && cdA !== cdB) return true; return (abC === 0 && onSegment(a, b, c)) || (abD === 0 && onSegment(a, b, d)) || (cdA === 0 && onSegment(c, d, a)) || (cdB === 0 && onSegment(c, d, b)); }
function pointInTriangle(p, a, b, c) { const ab = cross(a, b, p); const bc = cross(b, c, p); const ca = cross(c, a, p); return (ab >= -EPSILON && bc >= -EPSILON && ca >= -EPSILON) || (ab <= EPSILON && bc <= EPSILON && ca <= EPSILON); }
function diagonalClear(points, ids, ia, ib) {
  const a = points[ia]; const b = points[ib];
  for (let i = 0; i < ids.length; i += 1) { const u = ids[i]; const v = ids[(i + 1) % ids.length]; if (u === ia || u === ib || v === ia || v === ib) continue; if (segmentsIntersect(a, b, points[u], points[v])) return false; }
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let inside = false;
  for (let i = 0, j = ids.length - 1; i < ids.length; j = i++) { const p = points[ids[i]]; const q = points[ids[j]]; if ((p[1] > mid[1]) !== (q[1] > mid[1])) { const x = ((q[0] - p[0]) * (mid[1] - p[1])) / (q[1] - p[1]) + p[0]; if (mid[0] < x) inside = !inside; } }
  return inside;
}
function isSimple(points) {
  const n = points.length;
  if (n < 3) return false;
  if (n > 2048) return true;
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) {
    if (j === i || j === (i + 1) % n || i === (j + 1) % n) continue;
    if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
  }
  return true;
}

export function analyzeRing(ring) {
  const normalized = normalizeRing(ring); const points = unwrapRing(normalized); const intersections = []; const n = points.length;
  if (n <= 2048) for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) { if (j === i || j === (i + 1) % n || i === (j + 1) % n) continue; if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) { intersections.push([i, j]); if (intersections.length >= MAX_DIAGNOSTIC_INTERSECTIONS) break; } if (intersections.length >= MAX_DIAGNOSTIC_INTERSECTIONS) break; }
  return Object.freeze({ rawVertexCount: Array.isArray(ring) ? ring.length : 0, normalizedVertexCount: normalized.length, signedArea: signedArea(points), longitudeSpan: points.length ? Math.max(...points.map((p) => p[0])) - Math.min(...points.map((p) => p[0])) : 0, selfIntersections: Object.freeze(intersections), selfIntersectionCheck: n <= 2048 ? "complete" : "bounded-skipped", finite: points.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])), simple: isSimple(points) && Math.abs(signedArea(points)) > EPSILON });
}

export function triangulateRing(ring, context = {}) {
  const points = unwrapRing(normalizeRing(ring));
  if (points.length < 3 || Math.abs(signedArea(points)) <= EPSILON) return [];
  if (!isSimple(points)) return [];
  if (points.length > MAX_TRIANGULATION_VERTICES) throw new Error(`Province triangulation exceeds safety bound${context.provinceId ? ` province=${context.provinceId}` : ""}; vertices=${points.length}`);
  const ids = Array.from({ length: points.length }, (_, i) => i);
  if (signedArea(points) < 0) ids.reverse();
  const triangles = [];
  let guard = 0;
  while (ids.length > 3 && guard++ < points.length * points.length) {
    let found = -1;
    for (let i = 0; i < ids.length; i += 1) {
      const prev = ids[(i - 1 + ids.length) % ids.length]; const curr = ids[i]; const next = ids[(i + 1) % ids.length];
      if (cross(points[prev], points[curr], points[next]) <= EPSILON) continue;
      if (!diagonalClear(points, ids, prev, next)) continue;
      let contains = false;
      for (const candidate of ids) { if (candidate === prev || candidate === curr || candidate === next) continue; if (pointInTriangle(points[candidate], points[prev], points[curr], points[next])) { contains = true; break; } }
      if (contains) continue;
      found = i; break;
    }
    if (found < 0) return [];
    const prev = ids[(found - 1 + ids.length) % ids.length]; const curr = ids[found]; const next = ids[(found + 1) % ids.length];
    triangles.push(prev, curr, next); ids.splice(found, 1);
  }
  if (ids.length === 3 && Math.abs(cross(points[ids[0]], points[ids[1]], points[ids[2]])) > EPSILON) triangles.push(ids[0], ids[1], ids[2]);
  return triangles.length === (points.length - 2) * 3 ? triangles : [];
}

function simplifyRing(ring, target) {
  const source = normalizeRing(ring); if (source.length <= target || target < 3) return source;
  const step = source.length / target; const out = [];
  for (let i = 0; i < target; i += 1) out.push(source[Math.min(source.length - 1, Math.floor(i * step))]);
  const candidate = normalizeRing(out);
  return candidate.length >= 3 && Math.abs(signedArea(candidate)) > EPSILON && isSimple(candidate) ? candidate : source;
}
export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRing(ring); if (source.length < 3) return levels.map(() => source.slice());
  const output = []; let previous = source;
  for (let level = 0; level < levels.length; level += 1) { const factor = Number(levels[level]); const target = Math.min(previous.length, Math.max(3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1)))); const candidate = level === 0 ? source : simplifyRing(source, target); output.push(candidate); previous = candidate; }
  return output;
}

const qkey = (p, scale) => `${Math.round(p[0] * scale)},${Math.round(p[1] * scale)}`;
export function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10); const quantization = Number(options.quantization ?? 1e6); const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
  if (!Number.isFinite(tileSize) || tileSize <= 0 || !Number.isFinite(quantization) || quantization <= 0) throw new Error("Invalid GPU pack options.");
  const vertices = []; const indices = []; const vertexMap = new Map(); const provinces = []; const tiles = new Map();
  const vertex = (p) => { const key = qkey(p, quantization); const old = vertexMap.get(key); if (old !== undefined) return old; const id = vertices.length / 2; vertices.push(p[0], p[1]); vertexMap.set(key, id); return id; };
  entries.forEach((entry, provinceIndex) => {
    const provinceId = String(entry?.province?.identity?.id ?? entry?.province?.id ?? entry?.id ?? provinceIndex); const polygons = entry?.geometry?.polygons ?? []; const ranges = []; let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    onProgress?.({ phase: "province-start", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, vertexCount: vertices.length / 2, indexCount: indices.length });
    const lods = polygons.map((polygon) => buildLodRings(polygon));
    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (let polygonIndex = 0; polygonIndex < lods.length; polygonIndex += 1) {
        const ring = lods[polygonIndex]?.[lod]; if (ring.length < 3) continue;
        for (const p of ring) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); }
        const triangleIndices = triangulateRing(ring, { provinceId, polygonIndex, lod });
        for (const index of triangleIndices) indices.push(vertex(ring[index]));
      }
      const indexCount = indices.length - firstIndex; if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${provinceId}`); ranges.push(Object.freeze({ firstIndex, indexCount }));
      onProgress?.({ phase: "lod-complete", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, lod, vertexCount: vertices.length / 2, indexCount: indices.length, lodIndexCount: indexCount });
    }
    if (!Number.isFinite(minX)) throw new Error(`GPU province has no triangulable geometry: province=${provinceId}`);
    const bounds = Object.freeze({ minX, minY, maxX, maxY }); provinces.push(Object.freeze({ provinceIndex, provinceId, bounds, lodRanges: Object.freeze(ranges) }));
    for (let x = Math.floor(minX / tileSize); x <= Math.floor(maxX / tileSize); x += 1) for (let y = Math.floor(minY / tileSize); y <= Math.floor(maxY / tileSize); y += 1) { const key = `${x}:${y}`; if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] }); tiles.get(key).provinceIndices.push(provinceIndex); }
    onProgress?.({ phase: "province-complete", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, vertexCount: vertices.length / 2, indexCount: indices.length });
  });
  if (!indices.length) throw new Error("GPU province pack contains no triangles.");
  for (let i = 0; i < indices.length; i += 1) if (indices[i] < 0 || indices[i] >= vertices.length / 2) throw new Error(`GPU index out of bounds at ${i}`);
  for (let i = 0; i < vertices.length; i += 1) if (!Number.isFinite(vertices[i])) throw new Error(`GPU vertex is not finite at ${i}`);
  onProgress?.({ phase: "pack-complete", provinceCount: provinces.length, tileCount: tiles.size, vertexCount: vertices.length / 2, indexCount: indices.length });
  return Object.freeze({ version: 2, tileSize, quantization, vertices: new Float32Array(vertices), indices: new Uint32Array(indices), provinces: Object.freeze(provinces), tiles: Object.freeze([...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }))) });
}
