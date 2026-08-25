import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPointStrict,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const MAX_PROJECTION_DISTANCE = 0.75;
const EDGE_SAMPLES = 512;
const MAX_CANDIDATES = 16;
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

function uniquePoints(points) {
  const result = [];
  for (const point of points) {
    if (!point || !isPhysicalPoint(point)) continue;
    if (!result.some((candidate) => distance(candidate.point ?? candidate, point) <= GEOMETRY_EPS)) result.push(point);
  }
  return result;
}

function endpointCandidates(point, sourcePolygon) {
  const result = [];
  if (isPhysicalPoint(point) && pathInsideSource([point], sourcePolygon)) result.push({ point: [...point], displacement: 0, preferred: true });
  const strict = resolvePhysicalGeometryBoundaryPointStrict(point);
  if (strict && pathInsideSource([strict], sourcePolygon)) result.push({ point: [...strict], displacement: distance(point, strict), preferred: false });
  for (const candidate of boundaryCandidates(point)) {
    if (!pathInsideSource([candidate.point], sourcePolygon)) continue;
    result.push({ point: [...candidate.point], displacement: candidate.distance, preferred: false, boundary: candidate });
  }
  const deduped = [];
  for (const candidate of result) {
    if (!deduped.some((existing) => distance(existing.point, candidate.point) <= GEOMETRY_EPS)) deduped.push(candidate);
  }
  return deduped.slice(0, MAX_CANDIDATES);
}

function appendUnique(target, points) {
  for (const point of points) {
    const previous = target[target.length - 1];
    if (!previous || distance(previous[0] ?? previous, point[0] ?? point) > GEOMETRY_EPS) target.push(Array.isArray(point[0]) ? [...point] : [...point]);
  }
}

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
    if (isPhysicalPoint(point) && pathInsideSource([point], sourcePolygon)) {
      samples.push([{ point: [...point], cost: 0, previous: -1 }]);
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

function routeBetween(start, end, sourcePolygon) {
  if (pathIsPhysical([start, end]) && pathInsideSource([start, end], sourcePolygon)) return [start, end];
  const chain = boundaryChain(start, end, sourcePolygon);
  if (chain.length) return chain[0];
  return sampledBoundaryPath(start, end, sourcePolygon);
}

function repairPolygonByCandidateCycle(polygon, sourcePolygon) {
  const candidates = polygon.map((point) => endpointCandidates(point, sourcePolygon));
  if (candidates.some((items) => !items.length)) return null;

  const routeCache = new Map();
  const getRoute = (edgeIndex, fromIndex, toIndex) => {
    const key = `${edgeIndex}:${fromIndex}:${toIndex}`;
    if (routeCache.has(key)) return routeCache.get(key);
    const route = routeBetween(candidates[edgeIndex][fromIndex].point, candidates[(edgeIndex + 1) % candidates.length][toIndex].point, sourcePolygon);
    routeCache.set(key, route ?? null);
    return route;
  };

  let bestCycle = null;
  for (let firstIndex = 0; firstIndex < candidates[0].length; firstIndex += 1) {
    let states = new Map([[firstIndex, { cost: candidates[0][firstIndex].displacement * 0.25, paths: [] }]]);
    for (let edgeIndex = 0; edgeIndex < polygon.length - 1; edgeIndex += 1) {
      const nextStates = new Map();
      for (const [fromIndex, state] of states.entries()) {
        for (let toIndex = 0; toIndex < candidates[edgeIndex + 1].length; toIndex += 1) {
          const route = getRoute(edgeIndex, fromIndex, toIndex);
          if (!route) continue;
          const candidate = candidates[edgeIndex + 1][toIndex];
          const cost = state.cost + pathLength(route) + candidate.displacement * 0.25;
          const previous = nextStates.get(toIndex);
          if (!previous || cost < previous.cost) nextStates.set(toIndex, { cost, paths: [...state.paths, route] });
        }
      }
      states = nextStates;
      if (!states.size) break;
    }
    for (const [lastIndex, state] of states.entries()) {
      const closingRoute = getRoute(polygon.length - 1, lastIndex, firstIndex);
      if (!closingRoute) continue;
      const cost = state.cost + pathLength(closingRoute);
      if (!bestCycle || cost < bestCycle.cost) bestCycle = { cost, paths: [...state.paths, closingRoute] };
    }
  }

  if (!bestCycle) return null;
  const repaired = [];
  for (const path of bestCycle.paths) appendUnique(repaired, path);
  return repaired;
}

export function repairPhysicalPolygon(polygon, options = {}) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  const originalArea = Math.abs(signedArea(polygon));
  const sourcePolygon = options.containmentPolygon ?? null;
  if (polygon.every(isPhysicalPoint) && polygon.every((point, index) => pathIsPhysical([point, polygon[(index + 1) % polygon.length]]) && pathInsideSource([point, polygon[(index + 1) % polygon.length]], sourcePolygon))) return polygon;

  const repaired = repairPolygonByCandidateCycle(polygon, sourcePolygon);
  if (!repaired || repaired.length < 3 || repaired.some((point) => !isPhysicalPoint(point))) {
    throw new Error("Physical polygon repair could not construct a physical candidate cycle.");
  }
  const area = Math.abs(signedArea(repaired));
  if (!area || (originalArea > 0 && area / originalArea < MIN_REPAIR_AREA_RATIO)) throw new Error("Physical polygon repair collapsed more than 95% of the source area.");
  if (sourcePolygon && !pathInsideSource(repaired, sourcePolygon)) throw new Error("Physical polygon repair escaped the source partition cell.");
  if (!pathIsPhysical([...repaired, repaired[0]])) throw new Error("Physical polygon repair produced a non-physical boundary path.");
  return repaired;
}
