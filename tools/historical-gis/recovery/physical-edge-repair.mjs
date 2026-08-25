import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const GEOMETRY_EPS = 1e-8;
const SAMPLE_COUNT = 256;
const BINARY_ITERATIONS = 32;
const VALIDATION_SAMPLES = 12;
const CROSSING_SEARCH_MARGIN = 0.08;

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function sample(start, end, fraction) {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];
}

function isValidPoint(point) {
  return isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
}

function segmentIntersectionFraction(start, end, boundaryStart, boundaryEnd) {
  const rx = end[0] - start[0];
  const ry = end[1] - start[1];
  const sx = boundaryEnd[0] - boundaryStart[0];
  const sy = boundaryEnd[1] - boundaryStart[1];
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) <= EPS) return null;
  const qx = boundaryStart[0] - start[0];
  const qy = boundaryStart[1] - start[1];
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return Math.max(0, Math.min(1, t));
}

function intersections(start, end, boundaries, kind) {
  const result = [];
  for (const [boundaryIndex, boundary] of boundaries.entries()) {
    if (!Array.isArray(boundary) || boundary.length < 3) continue;
    for (let segmentIndex = 0; segmentIndex < boundary.length; segmentIndex += 1) {
      const nextIndex = (segmentIndex + 1) % boundary.length;
      const fraction = segmentIntersectionFraction(start, end, boundary[segmentIndex], boundary[nextIndex]);
      if (fraction === null) continue;
      const point = sample(start, end, fraction);
      if (!isFinalPhysicalGeometryBoundaryPoint(point)) continue;
      if (result.some((entry) => Math.abs(entry.fraction - fraction) <= EPS && entry.boundary === boundary)) continue;
      result.push({ fraction, point, boundary, boundaryIndex, segmentIndex, kind });
    }
  }
  return result.sort((a, b) => a.fraction - b.fraction);
}

function lakeIntersections(start, end) {
  return intersections(start, end, AUTHORITATIVE_LAKES.map((lake) => lake.coordinates), "lake")
    .map((entry) => ({ ...entry, lake: AUTHORITATIVE_LAKES[entry.boundaryIndex] }));
}

function landIntersections(start, end) {
  return intersections(start, end, PHYSICAL_LAND_POLYGONS, "land");
}

function locateTransition(start, end, validFraction, invalidFraction) {
  let valid = validFraction;
  let invalid = invalidFraction;
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (valid + invalid) / 2;
    if (isValidPoint(sample(start, end, midpoint))) valid = midpoint;
    else invalid = midpoint;
  }
  return (valid + invalid) / 2;
}

function pathLength(path) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]);
  return total;
}

function boundaryArcs(boundary, from, to) {
  const count = boundary.length;
  const forward = [from.point];
  let index = (from.segmentIndex + 1) % count;
  let guard = 0;
  while (index !== (to.segmentIndex + 1) % count && guard <= count) {
    forward.push(boundary[index]);
    index = (index + 1) % count;
    guard += 1;
  }
  forward.push(to.point);

  const backward = [from.point];
  index = from.segmentIndex;
  guard = 0;
  while (index !== to.segmentIndex && guard <= count) {
    backward.push(boundary[index]);
    index = (index - 1 + count) % count;
    guard += 1;
  }
  backward.push(to.point);
  return [forward, backward];
}

function pathIsValid(path) {
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    for (let sampleIndex = 1; sampleIndex < VALIDATION_SAMPLES; sampleIndex += 1) {
      if (!isValidPoint(sample(start, end, sampleIndex / VALIDATION_SAMPLES))) return false;
    }
  }
  return true;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function resolveBoundary(point) {
  if (isValidPoint(point)) return point;
  return resolvePhysicalGeometryBoundaryPoint(point);
}

function waterIntervals(start, end) {
  const states = [];
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const fraction = index / SAMPLE_COUNT;
    states.push({ fraction, valid: isValidPoint(sample(start, end, fraction)) });
  }
  const intervals = [];
  for (let index = 1; index < states.length; index += 1) {
    const previous = states[index - 1];
    const current = states[index];
    if (previous.valid === current.valid) continue;
    const fraction = locateTransition(
      start,
      end,
      previous.valid ? previous.fraction : current.fraction,
      previous.valid ? current.fraction : previous.fraction,
    );
    if (!current.valid) intervals.push({ entry: fraction, exit: null });
    else if (intervals.length && intervals[intervals.length - 1].exit === null) intervals[intervals.length - 1].exit = fraction;
  }
  return intervals.filter((interval) => interval.exit !== null && interval.exit > interval.entry + EPS);
}

function candidateArcs(crossings, interval, identity) {
  const minimum = Math.max(0, interval.entry - CROSSING_SEARCH_MARGIN);
  const maximum = Math.min(1, interval.exit + CROSSING_SEARCH_MARGIN);
  const groups = new Map();
  for (const crossing of crossings) {
    if (crossing.fraction < minimum - EPS || crossing.fraction > maximum + EPS) continue;
    const key = identity(crossing);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(crossing);
  }

  const candidates = [];
  for (const group of groups.values()) {
    const entries = group.filter((crossing) => crossing.fraction <= interval.entry + CROSSING_SEARCH_MARGIN);
    const exits = group.filter((crossing) => crossing.fraction >= interval.exit - CROSSING_SEARCH_MARGIN);
    for (const entry of entries) {
      for (const exit of exits) {
        if (exit.fraction <= entry.fraction + EPS) continue;
        for (const path of boundaryArcs(entry.boundary, entry, exit)) {
          if (!pathIsValid(path)) continue;
          candidates.push({ path, score: pathLength(path) + Math.abs(entry.fraction - interval.entry) + Math.abs(exit.fraction - interval.exit) });
        }
      }
    }
  }
  return candidates.sort((a, b) => a.score - b.score);
}

function repairPhysicalEdge(start, end) {
  if (distance(start, end) <= GEOMETRY_EPS) return [start, end];
  if (Array.from({ length: 17 }, (_, index) => isValidPoint(sample(start, end, index / 16))).every(Boolean)) return [start, end];

  const lakeCrossings = lakeIntersections(start, end);
  const landCrossings = landIntersections(start, end);
  const intervals = waterIntervals(start, end);
  if (!intervals.length) throw new Error(`Physical water crossing has no closed water interval: ${start.join(",")} -> ${end.join(",")}`);

  const repaired = [start];
  for (const interval of intervals) {
    const lakeCandidates = candidateArcs(lakeCrossings, interval, (crossing) => crossing.lake);
    const landCandidates = candidateArcs(landCrossings, interval, (crossing) => crossing.boundary);
    const candidate = [...lakeCandidates, ...landCandidates].sort((a, b) => a.score - b.score)[0];

    if (candidate) {
      appendUnique(repaired, candidate.path);
      continue;
    }

    const entry = resolveBoundary(sample(start, end, interval.entry));
    const exit = resolveBoundary(sample(start, end, interval.exit));
    if (!entry || !exit) throw new Error(`Physical water crossing has no authoritative boundary pair: ${start.join(",")} -> ${end.join(",")}`);
    const fallback = [entry, exit];
    if (!pathIsValid(fallback)) {
      throw new Error(`Physical water crossing has no validated boundary arc: ${start.join(",")} -> ${end.join(",")}`);
    }
    appendUnique(repaired, fallback);
  }
  appendUnique(repaired, [end]);

  for (let index = 0; index < repaired.length - 1; index += 1) {
    const segmentStart = repaired[index];
    const segmentEnd = repaired[index + 1];
    for (let sampleIndex = 1; sampleIndex < VALIDATION_SAMPLES; sampleIndex += 1) {
      if (!isValidPoint(sample(segmentStart, segmentEnd, sampleIndex / VALIDATION_SAMPLES))) {
        throw new Error(`Physical edge repair produced a water segment: ${segmentStart.join(",")} -> ${segmentEnd.join(",")}`);
      }
    }
  }
  return repaired;
}

export function repairPhysicalPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon must contain at least three vertices");
  const result = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    appendUnique(result, repairPhysicalEdge(start, end).slice(0, -1));
  }
  return result;
}
