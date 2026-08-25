import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPointStrict,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const MAX_PROJECTION_DISTANCE = 0.75;
const EDGE_SAMPLES = 256;
const MAX_CANDIDATES = 12;
const MAX_ARC_VERTICES = 4096;
const MIN_REPAIR_AREA_RATIO = 0.05;
const GEOMETRY_EPS = 1e-8;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const isPhysicalPoint = (p) => isPhysicalLandPoint(p) || isFinalPhysicalGeometryBoundaryPoint(p);

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const d = dx * dx + dy * dy;
  if (d <= EPS) return { point: [...start], distance: distance(point, start), fraction: 0 };
  const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / d));
  const projected = [start[0] + dx * fraction, start[1] + dy * fraction];
  return { point: projected, distance: distance(point, projected), fraction };
}

function ringsForLake(lake) { return lake?.rings ?? (lake?.coordinates ? [lake.coordinates] : []); }
function buildBoundaries() {
  const result = [];
  for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) {
    for (const [ringIndex, ring] of ringsForLake(lake).entries()) {
      if (Array.isArray(ring) && ring.length >= 3) result.push({ kind: "lake", boundary: ring, lakeIndex, ringIndex });
    }
  }
  for (const [landIndex, boundary] of PHYSICAL_LAND_POLYGONS.entries()) {
    if (Array.isArray(boundary) && boundary.length >= 3) result.push({ kind: "land", boundary, landIndex });
  }
  return result;
}
const BOUNDARIES = buildBoundaries();

function boundaryCandidates(point) {
  const result = [];
  for (const descriptor of BOUNDARIES) {
    for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) {
      const start = descriptor.boundary[segmentIndex];
      const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length];
      const projection = nearestPointOnSegment(point, start, end);
      if (projection.distance <= MAX_PROJECTION_DISTANCE) {
        result.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance });
      }
    }
  }
  return result.sort((a, b) => a.distance - b.distance).slice(0, MAX_CANDIDATES);
}

function pointInOrOnPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    const cross = (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]);
    if (Math.abs(cross) <= GEOMETRY_EPS * Math.max(1, distance(a, b))
      && point[0] >= Math.min(a[0], b[0]) - GEOMETRY_EPS
      && point[0] <= Math.max(a[0], b[0]) + GEOMETRY_EPS
      && point[1] >= Math.min(a[1], b[1]) - GEOMETRY_EPS
      && point[1] <= Math.max(a[1], b[1]) + GEOMETRY_EPS) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
  }
  return inside;
}

function pathInsideSource(path, sourcePolygon) { return !sourcePolygon || path.every((p) => pointInOrOnPolygon(p, sourcePolygon)); }
function pathIsPhysical(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const count = Math.max(8, Math.ceil(distance(start, end) / 0.005));
    for (let sampleIndex = 1; sampleIndex < count; sampleIndex += 1) {
      if (!isPhysicalPoint(sample(start, end, sampleIndex / count))) return false;
    }
  }
  return true;
}
function pathLength(path) { let total = 0; for (let i = 1; i < path.length; i += 1) total += distance(path[i - 1], path[i]); return total; }
function signedArea(polygon) { let sum = 0; for (let i = 0; i < polygon.length; i += 1) { const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; sum += a[0] * b[1] - b[0] * a[1]; } return sum / 2; }
function normalizeEndpoint(point) {
  if (isPhysicalPoint(point)) return [...point];
  const strict = resolvePhysicalGeometryBoundaryPointStrict(point);
  if (strict && isPhysicalPoint(strict)) return [...strict];
  const candidate = boundaryCandidates(point)[0];
  return candidate ? [...candidate.point] : null;
}
function appendUnique(target, points) { for (const point of points) { const previous = target[target.length - 1]; if (!previous || distance(previous, point) > GEOMETRY_EPS) target.push([...point]); } }

function sameBoundaryArc(from, to) {
  if (!from || !to || from.boundary !== to.boundary) return [];
  const boundary = from.boundary;
  const count = boundary.length;
  const paths = [];
  for (const direction of [1, -1]) {
    const path = [from.point];
    let index = direction === 1 ? (from.segmentIndex + 1) % count : from.segmentIndex;
    let guard = 0;
    const target = direction === 1 ? (to.segmentIndex + 1) % count : to.segmentIndex;
    while (index !== target && guard <= count && path.length <= MAX_ARC_VERTICES) {
      path.push(boundary[index]);
      index = (index + direction + count) % count;
      guard += 1;
    }
    path.push(to.point);
    paths.push(path);
  }
  return paths;
}

function boundaryChain(start, end, sourcePolygon) {
  const a = boundaryCandidates(start);
  const b = boundaryCandidates(end);
  const pairs = [];
  for (const left of a) for (const right of b) {
    if (left.kind !== right.kind) continue;
    const direct = [left.point, right.point];
    if (pathIsPhysical(direct) && pathInsideSource(direct, sourcePolygon)) pairs.push(direct);
    for (const arc of sameBoundaryArc(left, right)) {
      if (pathIsPhysical(arc) && pathInsideSource(arc, sourcePolygon)) pairs.push(arc);
    }
  }
  return pairs.sort((x, y) => pathLength(x) - pathLength(y));
}

function sampledBoundaryPath(start, end, sourcePolygon) {
  const samples = [];
  for (let index = 0; index <= EDGE_SAMPLES; index += 1) {
    const fraction = index / EDGE_SAMPLES;
    const point = sample(start, end, fraction);
    if (isPhysicalPoint(point)) {
      samples.push([{ point, cost: 0, previous: -1 }]);
    } else {
      const candidates = boundaryCandidates(point)
        .filter((candidate) => pathInsideSource([candidate.point], sourcePolygon))
        .map((candidate) => ({ ...candidate, cost: candidate.distance, previous: -1 }));
      if (!candidates.length) return null;
      samples.push(candidates);
    }
  }

  for (let i = 1; i < samples.length; i += 1) {
    const current = samples[i];
    const previous = samples[i - 1];
    const next = [];
    for (const candidate of current) {
      let best = null;
      for (let j = 0; j < previous.length; j += 1) {
        const prev = previous[j];
        if (!pathIsPhysical([prev.point, candidate.point])) continue;
        if (!pathInsideSource([prev.point, candidate.point], sourcePolygon)) continue;
        const score = prev.cost + candidate.cost + pathLength([prev.point, candidate.point]);
        if (!best || score < best.cost) best = { ...candidate, cost: score, previous: j };
      }
      if (best) next.push(best);
    }
    if (!next.length) return null;
    samples[i] = next.sort((a, b) => a.cost - b.cost).slice(0, MAX_CANDIDATES);
  }

  let index = samples.length - 1;
  let candidate = samples[index][0];
  const path = [];
  while (index >= 0 && candidate) {
    path.push(candidate.point);
    const previousIndex = candidate.previous;
    index -= 1;
    candidate = index >= 0 ? samples[index][previousIndex] : null;
  }
  path.reverse();
  if (!pathIsPhysical(path) || !pathInsideSource(path, sourcePolygon)) return null;
  return path;
}

function repairEdge(start, end, sourcePolygon) {
  if (pathIsPhysical([start, end]) && pathInsideSource([start, end], sourcePolygon)) return [start, end];
  const chain = boundaryChain(start, end, sourcePolygon);
  if (chain.length) return chain[0];
  const sampled = sampledBoundaryPath(start, end, sourcePolygon);
  if (sampled) return sampled;
  throw new Error(`Physical edge recovery failed (${start.join(",")} → ${end.join(",")}).`);
}

export function repairPhysicalPolygon(polygon, options = {}) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  const originalArea = Math.abs(signedArea(polygon));
  const sourcePolygon = options.containmentPolygon ?? null;
  if (polygon.every(isPhysicalPoint) && polygon.every((point, index) => pathIsPhysical([point, polygon[(index + 1) % polygon.length]]))) return polygon;
  const normalized = polygon.map(normalizeEndpoint);
  if (normalized.some((point) => !point)) throw new Error("No authoritative physical boundary candidate exists for a polygon vertex.");
  const repaired = [];
  for (let index = 0; index < normalized.length; index += 1) {
    const start = normalized[index];
    const end = normalized[(index + 1) % normalized.length];
    appendUnique(repaired, repairEdge(start, end, sourcePolygon));
  }
  if (repaired.length < 3 || repaired.some((point) => !isPhysicalPoint(point))) throw new Error("Physical polygon repair produced invalid geometry.");
  const area = Math.abs(signedArea(repaired));
  if (!area || (originalArea > 0 && area / originalArea < MIN_REPAIR_AREA_RATIO)) throw new Error("Physical polygon repair collapsed more than 95% of the source area.");
  if (sourcePolygon && !pathInsideSource(repaired, sourcePolygon)) throw new Error("Physical polygon repair escaped the source partition cell.");
  if (!pathIsPhysical([...repaired, repaired[0]])) throw new Error("Physical polygon repair produced a non-physical boundary path.");
  return repaired;
}
