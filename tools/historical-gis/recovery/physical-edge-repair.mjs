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

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function sample(start, end, fraction) {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];
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
    if (isPhysicalLandPoint(sample(start, end, midpoint)) || isFinalPhysicalGeometryBoundaryPoint(sample(start, end, midpoint))) {
      valid = midpoint;
    } else {
      invalid = midpoint;
    }
  }
  return (valid + invalid) / 2;
}

function nearestCrossing(crossings, fraction, minimum, maximum) {
  return crossings
    .filter((crossing) => crossing.fraction >= minimum - EPS && crossing.fraction <= maximum + EPS)
    .sort((a, b) => Math.abs(a.fraction - fraction) - Math.abs(b.fraction - fraction))[0] ?? null;
}

function pathLength(path) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]);
  return total;
}

function boundaryArc(boundary, from, to) {
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
  return pathLength(forward) <= pathLength(backward) ? forward : backward;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function resolveBoundary(point) {
  if (isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point)) return point;
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (!resolved) return null;
  return resolved;
}

function waterIntervals(start, end) {
  const states = [];
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const fraction = index / SAMPLE_COUNT;
    const point = sample(start, end, fraction);
    states.push({
      fraction,
      valid: isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point),
    });
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
    if (current.valid === false) intervals.push({ entry: fraction, exit: null });
    else if (intervals.length && intervals[intervals.length - 1].exit === null) intervals[intervals.length - 1].exit = fraction;
  }
  return intervals.filter((interval) => interval.exit !== null && interval.exit > interval.entry + EPS);
}

function repairPhysicalEdge(start, end) {
  if (distance(start, end) <= GEOMETRY_EPS) return [start, end];
  const directValid = Array.from({ length: 17 }, (_, index) => isPhysicalLandPoint(sample(start, end, index / 16)) || isFinalPhysicalGeometryBoundaryPoint(sample(start, end, index / 16)));
  if (directValid.every(Boolean)) return [start, end];

  const lakeCrossings = lakeIntersections(start, end);
  const landCrossings = landIntersections(start, end);
  const intervals = waterIntervals(start, end);
  if (!intervals.length) throw new Error(`Physical water crossing has no closed water interval: ${start.join(",")} -> ${end.join(",")}`);

  const repaired = [start];
  for (const interval of intervals) {
    const lakeEntry = nearestCrossing(lakeCrossings, interval.entry, interval.entry - 1 / SAMPLE_COUNT, interval.exit + 1 / SAMPLE_COUNT);
    const lakeExit = lakeEntry
      ? nearestCrossing(lakeCrossings.filter((crossing) => crossing.lake === lakeEntry.lake), interval.exit, interval.entry - 1 / SAMPLE_COUNT, interval.exit + 1 / SAMPLE_COUNT)
      : null;

    if (lakeEntry && lakeExit) {
      appendUnique(repaired, [lakeEntry.point]);
      appendUnique(repaired, boundaryArc(lakeEntry.lake.coordinates, lakeEntry, lakeExit));
      continue;
    }

    const landEntry = nearestCrossing(landCrossings, interval.entry, interval.entry - 1 / SAMPLE_COUNT, interval.exit + 1 / SAMPLE_COUNT);
    const landExit = landEntry
      ? nearestCrossing(landCrossings.filter((crossing) => crossing.boundary === landEntry.boundary), interval.exit, interval.entry - 1 / SAMPLE_COUNT, interval.exit + 1 / SAMPLE_COUNT)
      : null;

    if (landEntry && landExit) {
      appendUnique(repaired, [landEntry.point]);
      appendUnique(repaired, boundaryArc(landEntry.boundary, landEntry, landExit));
      continue;
    }

    const entry = resolveBoundary(sample(start, end, interval.entry));
    const exit = resolveBoundary(sample(start, end, interval.exit));
    if (!entry || !exit) throw new Error(`Physical water crossing has no authoritative boundary pair: ${start.join(",")} -> ${end.join(",")}`);
    appendUnique(repaired, [entry, exit]);
  }
  appendUnique(repaired, [end]);

  for (let index = 0; index < repaired.length - 1; index += 1) {
    const segmentStart = repaired[index];
    const segmentEnd = repaired[index + 1];
    for (let sampleIndex = 1; sampleIndex < VALIDATION_SAMPLES; sampleIndex += 1) {
      const point = sample(segmentStart, segmentEnd, sampleIndex / VALIDATION_SAMPLES);
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) {
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
