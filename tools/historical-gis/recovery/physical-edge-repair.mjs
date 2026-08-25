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
const MAX_BOUNDARY_PROJECTION_DISTANCE = 0.02;
const MAX_BOUNDARY_CANDIDATES = 8;
const MAX_RECOVERY_CONNECTOR_DISTANCE = 0.02;

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function sample(start, end, fraction) {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];
}

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  if (denominator <= EPS) return { point: [...start], fraction: 0, distance: distance(point, start) };
  const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const candidate = [start[0] + dx * fraction, start[1] + dy * fraction];
  return { point: candidate, fraction, distance: distance(point, candidate) };
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

function normalizeRings(geometry) {
  if (!Array.isArray(geometry) || !geometry.length) return [];
  if (Array.isArray(geometry[0]) && Array.isArray(geometry[0][0])) return geometry.filter((ring) => Array.isArray(ring) && ring.length >= 3);
  return geometry.length >= 3 ? [geometry] : [];
}

function lakeRings(lake) {
  return normalizeRings(lake?.rings ?? lake?.coordinates);
}

function lakeBoundaryDescriptors() {
  const result = [];
  for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) {
    for (const [ringIndex, ring] of lakeRings(lake).entries()) {
      result.push({ lake, lakeIndex, ring, ringIndex });
    }
  }
  return result;
}

const LAKE_BOUNDARIES = lakeBoundaryDescriptors();

function intersections(start, end, boundaries, kind) {
  const result = [];
  for (const descriptor of boundaries) {
    const boundary = descriptor.ring ?? descriptor;
    if (!Array.isArray(boundary) || boundary.length < 3) continue;
    for (let segmentIndex = 0; segmentIndex < boundary.length; segmentIndex += 1) {
      const nextIndex = (segmentIndex + 1) % boundary.length;
      const fraction = segmentIntersectionFraction(start, end, boundary[segmentIndex], boundary[nextIndex]);
      if (fraction === null) continue;
      const point = sample(start, end, fraction);
      if (!isFinalPhysicalGeometryBoundaryPoint(point)) continue;
      const duplicate = result.some((entry) => Math.abs(entry.fraction - fraction) <= EPS
        && entry.boundary === boundary
        && entry.segmentIndex === segmentIndex);
      if (duplicate) continue;
      result.push({
        fraction,
        point,
        boundary,
        boundaryIndex: descriptor.boundaryIndex,
        segmentIndex,
        kind,
        distance: 0,
        lake: descriptor.lake,
        lakeIndex: descriptor.lakeIndex,
        ringIndex: descriptor.ringIndex,
      });
    }
  }
  return result.sort((a, b) => a.fraction - b.fraction);
}

function projectedBoundaryCandidates(point, boundaries, kind) {
  const result = [];
  for (const descriptor of boundaries) {
    const boundary = descriptor.ring ?? descriptor;
    if (!Array.isArray(boundary) || boundary.length < 3) continue;
    for (let segmentIndex = 0; segmentIndex < boundary.length; segmentIndex += 1) {
      const nextIndex = (segmentIndex + 1) % boundary.length;
      const projection = nearestPointOnSegment(point, boundary[segmentIndex], boundary[nextIndex]);
      if (projection.distance > MAX_BOUNDARY_PROJECTION_DISTANCE) continue;
      result.push({
        point: projection.point,
        boundary,
        boundaryIndex: descriptor.boundaryIndex,
        segmentIndex,
        kind,
        distance: projection.distance,
        lake: descriptor.lake,
        lakeIndex: descriptor.lakeIndex,
        ringIndex: descriptor.ringIndex,
      });
    }
  }
  result.sort((a, b) => a.distance - b.distance);
  return result.slice(0, MAX_BOUNDARY_CANDIDATES);
}

function lakeIntersections(start, end) {
  return intersections(start, end, LAKE_BOUNDARIES, "lake");
}

function landIntersections(start, end) {
  return intersections(start, end, PHYSICAL_LAND_POLYGONS, "land");
}

function projectedLakeCandidates(point) {
  return projectedBoundaryCandidates(point, LAKE_BOUNDARIES, "lake");
}

function projectedLandCandidates(point) {
  return projectedBoundaryCandidates(point, PHYSICAL_LAND_POLYGONS, "land");
}

function locateTransition(start, end, validFraction, invalidFraction) {
  let valid = validFraction;
  let invalid = invalidFraction;
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (valid + invalid) / 2;
    const point = sample(start, end, midpoint);
    if (isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point)) valid = midpoint;
    else invalid = midpoint;
  }
  return (valid + invalid) / 2;
}

function pathLength(path) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]);
  return total;
}

function boundaryArcCandidates(boundary, from, to) {
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

function isValidPhysicalPath(path) {
  for (let index = 0; index < path.length - 1; index += 1) {
    const segmentStart = path[index];
    const segmentEnd = path[index + 1];
    for (let sampleIndex = 1; sampleIndex < VALIDATION_SAMPLES; sampleIndex += 1) {
      const point = sample(segmentStart, segmentEnd, sampleIndex / VALIDATION_SAMPLES);
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function chooseBoundaryArc(boundary, from, to) {
  const candidates = boundaryArcCandidates(boundary, from, to)
    .filter(isValidPhysicalPath)
    .sort((a, b) => pathLength(a) - pathLength(b));
  return candidates[0] ?? null;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function resolveBoundary(point) {
  if (isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point)) return [...point];
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (!resolved) return null;
  return [...resolved];
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

function withinInterval(crossing, interval) {
  return crossing.fraction >= interval.entry - 0.02 && crossing.fraction <= interval.exit + 0.02;
}

function connectorIsValid(from, to) {
  return distance(from, to) <= MAX_RECOVERY_CONNECTOR_DISTANCE || isValidPhysicalPath([from, to]);
}

function recoveryCandidates(interval, start, end, lakeCrossings, landCrossings) {
  const entryTransition = sample(start, end, interval.entry);
  const exitTransition = sample(start, end, interval.exit);
  const result = [];

  const lakeEntries = [
    ...lakeCrossings.filter((crossing) => withinInterval(crossing, interval)),
    ...projectedLakeCandidates(entryTransition),
  ];
  const lakeExits = [
    ...lakeCrossings.filter((crossing) => withinInterval(crossing, interval)),
    ...projectedLakeCandidates(exitTransition),
  ];
  for (const entry of lakeEntries) {
    for (const exit of lakeExits) {
      if (entry.lake !== exit.lake || entry.ringIndex !== exit.ringIndex) continue;
      if (distance(entry.point, exit.point) <= GEOMETRY_EPS) continue;
      if (!connectorIsValid(entryTransition, entry.point) || !connectorIsValid(exit.point, exitTransition)) continue;
      const arc = chooseBoundaryArc(entry.boundary, entry, exit);
      if (!arc) continue;
      const path = [entryTransition, ...arc, exitTransition];
      if (!isValidPhysicalPath(path)) continue;
      result.push({ path, score: pathLength(path) + entry.distance + exit.distance });
    }
  }

  const landEntries = [
    ...landCrossings.filter((crossing) => withinInterval(crossing, interval)),
    ...projectedLandCandidates(entryTransition),
  ];
  const landExits = [
    ...landCrossings.filter((crossing) => withinInterval(crossing, interval)),
    ...projectedLandCandidates(exitTransition),
  ];
  for (const entry of landEntries) {
    for (const exit of landExits) {
      if (entry.boundary !== exit.boundary) continue;
      if (distance(entry.point, exit.point) <= GEOMETRY_EPS) continue;
      if (!connectorIsValid(entryTransition, entry.point) || !connectorIsValid(exit.point, exitTransition)) continue;
      const arc = chooseBoundaryArc(entry.boundary, entry, exit);
      if (!arc) continue;
      const path = [entryTransition, ...arc, exitTransition];
      if (!isValidPhysicalPath(path)) continue;
      result.push({ path, score: pathLength(path) + entry.distance + exit.distance });
    }
  }

  return result.sort((a, b) => a.score - b.score);
}

function repairPhysicalEdge(start, end) {
  if (distance(start, end) <= GEOMETRY_EPS) return [start, end];
  const directValid = Array.from({ length: 17 }, (_, index) => {
    const point = sample(start, end, index / 16);
    return isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
  });
  if (directValid.every(Boolean)) return [start, end];

  const lakeCrossings = lakeIntersections(start, end);
  const landCrossings = landIntersections(start, end);
  const intervals = waterIntervals(start, end);
  if (!intervals.length) throw new Error(`Physical water crossing has no closed water interval: ${start.join(",")} -> ${end.join(",")}`);

  const repaired = [start];
  let cursor = start;
  for (const interval of intervals) {
    const entryTransition = sample(start, end, interval.entry);
    const exitTransition = sample(start, end, interval.exit);

    if (!isValidPhysicalPath([cursor, entryTransition])) {
      throw new Error(`Physical water crossing has invalid valid-span before recovery: ${start.join(",")} -> ${end.join(",")}`);
    }
    appendUnique(repaired, [entryTransition]);

    const candidates = recoveryCandidates(interval, start, end, lakeCrossings, landCrossings);
    const selected = candidates[0];
    if (!selected) {
      const entry = resolveBoundary(entryTransition);
      const exit = resolveBoundary(exitTransition);
      if (!entry || !exit || !connectorIsValid(entryTransition, entry) || !connectorIsValid(exit, exitTransition)) {
        throw new Error(`Physical water crossing has no authoritative boundary pair: ${start.join(",")} -> ${end.join(",")}`);
      }
      const fallback = [entryTransition, entry, exit, exitTransition];
      if (!isValidPhysicalPath(fallback)) {
        throw new Error(`Physical water crossing has no valid boundary recovery path: ${start.join(",")} -> ${end.join(",")}`);
      }
      appendUnique(repaired, fallback.slice(1));
    } else {
      appendUnique(repaired, selected.path.slice(1));
    }
    cursor = exitTransition;
  }

  if (!isValidPhysicalPath([cursor, end])) {
    throw new Error(`Physical water crossing has invalid valid-span after recovery: ${start.join(",")} -> ${end.join(",")}`);
  }
  appendUnique(repaired, [end]);

  if (!isValidPhysicalPath(repaired)) {
    for (let index = 0; index < repaired.length - 1; index += 1) {
      const segmentStart = repaired[index];
      const segmentEnd = repaired[index + 1];
      if (!isValidPhysicalPath([segmentStart, segmentEnd])) {
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
