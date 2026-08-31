/** Deterministic indexed GPU province geometry. HMAP/GIS remains authoritative. */
const EPSILON = 1e-10;
const POSITION_EPSILON = 1e-7;
const COLLINEAR_EPSILON = 1e-12;

const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const squaredDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};
const same = (a, b) => squaredDistance(a, b) <= POSITION_EPSILON ** 2;

export function normalizeRing(ring) {
  const out = [];
  const seen = new Set();
  for (const point of Array.isArray(ring) ? ring : []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    if (out.length && same(out[out.length - 1], p)) continue;
    const key = `${Math.round(p[0] / POSITION_EPSILON)},${Math.round(p[1] / POSITION_EPSILON)}`;
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
      if (same(a, c) || squaredDistance(a, b) <= POSITION_EPSILON ** 2 || squaredDistance(b, c) <= POSITION_EPSILON ** 2) {
        out.splice(i, 1);
        changed = true;
        i -= 1;
        continue;
      }
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

function unwrapRing(points) {
  if (points.length < 2) return points.map((point) => point.slice());
  const out = [points[0].slice()];
  for (let i = 1; i < points.length; i += 1) {
    let longitude = points[i][0];
    const previousLongitude = out[i - 1][0];
    while (longitude - previousLongitude > 180) longitude -= 360;
    while (longitude - previousLongitude < -180) longitude += 360;
    out.push([longitude, points[i][1]]);
  }
  return out;
}

function orientation(a, b, c) { const value = cross(a, b, c); if (Math.abs(value) <= EPSILON) return 0; return value > 0 ? 1 : -1; }
function onSegment(a, b, p) { return orientation(a, b, p) === 0 && p[0] >= Math.min(a[0], b[0]) - EPSILON && p[0] <= Math.max(a[0], b[0]) + EPSILON && p[1] >= Math.min(a[1], b[1]) - EPSILON && p[1] <= Math.max(a[1], b[1]) + EPSILON; }
function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c); const abD = orientation(a, b, d); const cdA = orientation(c, d, a); const cdB = orientation(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && onSegment(a, b, c)) || (abD === 0 && onSegment(a, b, d)) || (cdA === 0 && onSegment(c, d, a)) || (cdB === 0 && onSegment(c, d, b));
}
function pointInPolygon(point, points, ids) {
  let inside = false;
  for (let i = 0, j = ids.length - 1; i < ids.length; j = i++) {
    const a = points[ids[i]]; const b = points[ids[j]];
    if (onSegment(a, b, point)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1])) {
      const x = ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0];
      if (point[0] < x) inside = !inside;
    }
  }
  return inside;
}
function diagonalClear(points, ids, ia, ib) {
  const a = points[ia]; const b = points[ib];
  for (let i = 0; i < ids.length; i += 1) {
    const u = ids[i]; const v = ids[(i + 1) % ids.length];
    if (u === ia || u === ib || v === ia || v === ib) continue;
    if (segmentsIntersect(a, b, points[u], points[v])) return false;
  }
  return pointInPolygon([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], points, ids);
}
function strictlyInside(point, a, b, c) {
  const x = cross(a, b, point); const y = cross(b, c, point); const z = cross(c, a, point);
  return (x > EPSILON && y > EPSILON && z > EPSILON) || (x < -EPSILON && y < -EPSILON && z < -EPSILON);
}
function earClip(points, inputIds = null) {
  const ids = inputIds ? inputIds.slice() : Array.from({ length: points.length }, (_, i) => i);
  if (signedArea(ids.map((id) => points[id])) < 0) ids.reverse();
  const remaining = ids.slice(); const out = []; let guard = 0;
  while (remaining.length > 3 && guard++ < ids.length * ids.length * 4) {
    let found = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const a = remaining[(i - 1 + remaining.length) % remaining.length]; const b = remaining[i]; const c = remaining[(i + 1) % remaining.length];
      if (cross(points[a], points[b], points[c]) <= EPSILON || !diagonalClear(points, remaining, a, c)) continue;
      let blocked = false;
      for (const k of remaining) if (k !== a && k !== b && k !== c && strictlyInside(points[k], points[a], points[b], points[c])) { blocked = true; break; }
      if (!blocked) { found = i; break; }
    }
    if (found < 0) return null;
    out.push(remaining[(found - 1 + remaining.length) % remaining.length], remaining[found], remaining[(found + 1) % remaining.length]);
    remaining.splice(found, 1);
  }
  if (remaining.length === 3 && cross(points[remaining[0]], points[remaining[1]], points[remaining[2]]) > EPSILON) out.push(...remaining);
  return out.length === (ids.length - 2) * 3 ? out : null;
}
function candidateDiagonals(points, ids) {
  const candidates = [];
  for (let i = 0; i < ids.length; i += 1) for (let j = i + 2; j < ids.length; j += 1) {
    if (i === 0 && j === ids.length - 1) continue;
    if (diagonalClear(points, ids, ids[i], ids[j])) candidates.push({ a: ids[i], b: ids[j], span: j - i });
  }
  candidates.sort((x, y) => x.span - y.span || x.a - y.a || x.b - y.b);
  return candidates;
}
function splitIds(ids, a, b) {
  const ia = ids.indexOf(a); const ib = ids.indexOf(b); if (ia < 0 || ib < 0) return null;
  const first = []; for (let i = ia; ; i = (i + 1) % ids.length) { first.push(ids[i]); if (i === ib) break; }
  const second = []; for (let i = ib; ; i = (i + 1) % ids.length) { second.push(ids[i]); if (i === ia) break; }
  return first.length >= 3 && second.length >= 3 ? [first, second] : null;
}
function decompose(points, ids, depth = 0) {
  if (ids.length < 3 || depth > ids.length * 2) return null;
  const clipped = earClip(points, ids); if (clipped) return clipped;
  for (const diagonal of candidateDiagonals(points, ids)) {
    const split = splitIds(ids, diagonal.a, diagonal.b); if (!split) continue;
    const left = decompose(points, split[0], depth + 1); if (!left) continue;
    const right = decompose(points, split[1], depth + 1); if (right) return [...left, ...right];
  }
  return null;
}
export function triangulateRing(ring, context = {}) {
  const normalized = normalizeRing(ring); if (normalized.length < 3) return [];
  const points = unwrapRing(normalized);
  if (Math.abs(signedArea(points)) <= EPSILON) return [];
  const ids = Array.from({ length: points.length }, (_, i) => i); const result = earClip(points, ids) || decompose(points, ids);
  if (!result) {
    const longitudeSpan = Math.max(...points.map(([longitude]) => longitude)) - Math.min(...points.map(([longitude]) => longitude));
    throw new Error(`Province triangulation failed${context.provinceId ? ` province=${context.provinceId}` : ""}${context.lod === undefined ? "" : ` lod=${context.lod}`}; vertices=${points.length}; unwrappedLongitudeSpan=${longitudeSpan.toFixed(3)}`);
  }
  return result;
}

function simplifyRing(ring, target) {
  const points = normalizeRing(ring); if (points.length <= target || target < 3) return points;
  const out = [];
  for (let i = 0; i < target; i += 1) out.push(points[Math.min(points.length - 1, Math.round((i * (points.length - 1)) / Math.max(1, target - 1)))]);
  return normalizeRing(out);
}

function ringIsValid(ring) {
  const points = normalizeRing(ring);
  if (points.length < 3 || Math.abs(signedArea(unwrapRing(points))) <= EPSILON) return false;
  const working = unwrapRing(points);
  for (let i = 0; i < working.length; i += 1) {
    const a = working[i]; const b = working[(i + 1) % working.length];
    for (let j = i + 1; j < working.length; j += 1) {
      if (j === i || (j + 1) % working.length === i || j === (i + 1) % working.length) continue;
      if (segmentsIntersect(a, b, working[j], working[(j + 1) % working.length])) return false;
    }
  }
  try { return triangulateRing(points).length > 0; } catch { return false; }
}

export function buildLodRings(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRing(ring);
  if (source.length < 3) return levels.map(() => source.slice());
  const output = [];
  let previous = source;
  for (let level = 0; level < levels.length; level += 1) {
    const factor = Number(levels[level]);
    const target = Math.min(previous.length, Math.max(level === 0 ? 3 : 3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1))));
    const candidate = level === 0 ? source : simplifyRing(source, target);
    const valid = ringIsValid(candidate);
    const selected = valid ? candidate : previous;
    output.push(selected);
    previous = selected;
  }
  return output;
}

const qkey = (point, scale) => `${Math.round(point[0] * scale)},${Math.round(point[1] * scale)}`;
export function buildIndexedProvincePack(entries = [], options = {}) {
  const tileSize = Number(options.tileSize ?? 10); const quantization = Number(options.quantization ?? 1e6);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new Error("Invalid tile size");
  if (!Number.isFinite(quantization) || quantization <= 0) throw new Error("Invalid quantization");
  const vertices = []; const indices = []; const map = new Map(); const provinces = []; const tiles = new Map();
  const vertex = (point) => { const key = qkey(point, quantization); const old = map.get(key); if (old !== undefined) return old; const index = vertices.length / 2; vertices.push(point[0], point[1]); map.set(key, index); return index; };
  entries.forEach((entry, provinceIndex) => {
    const id = String(entry?.province?.identity?.id ?? entry?.province?.id ?? entry?.id ?? provinceIndex); const polygons = entry?.geometry?.polygons ?? entry?.polygons ?? [];
    const ranges = []; let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (const polygon of polygons) {
        const ring = buildLodRings(polygon)[lod]; if (ring.length < 3) continue;
        for (const point of ring) { minX = Math.min(minX, point[0]); minY = Math.min(minY, point[1]); maxX = Math.max(maxX, point[0]); maxY = Math.max(maxY, point[1]); }
        for (const index of triangulateRing(ring, { provinceId: id, lod })) indices.push(vertex(ring[index]));
      }
      const indexCount = indices.length - firstIndex; if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${id}`);
      ranges.push(Object.freeze({ firstIndex, indexCount }));
    }
    const bounds = Number.isFinite(minX) ? Object.freeze({ minX, minY, maxX, maxY }) : null;
    provinces.push(Object.freeze({ provinceIndex, provinceId: id, bounds, lodRanges: Object.freeze(ranges) }));
    if (bounds) for (let x = Math.floor(bounds.minX / tileSize); x <= Math.floor(bounds.maxX / tileSize); x += 1) for (let y = Math.floor(bounds.minY / tileSize); y <= Math.floor(bounds.maxY / tileSize); y += 1) {
      const key = `${x}:${y}`; if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] }); tiles.get(key).provinceIndices.push(provinceIndex);
    }
  });
  for (let i = 0; i < indices.length; i += 1) if (indices[i] < 0 || indices[i] >= vertices.length / 2) throw new Error(`GPU index out of bounds at ${i}`);
  for (let i = 0; i < vertices.length; i += 1) if (!Number.isFinite(vertices[i])) throw new Error(`GPU vertex is not finite at ${i}`);
  return Object.freeze({ version: 2, tileSize, quantization, vertices: new Float32Array(vertices), indices: new Uint32Array(indices), provinces: Object.freeze(provinces), tiles: Object.freeze([...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }))) });
}
