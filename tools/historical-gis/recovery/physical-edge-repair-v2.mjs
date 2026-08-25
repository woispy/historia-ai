import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  nearestLakeBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const GEOMETRY_EPS = 1e-8;
const EDGE_SAMPLES = 2048;
const BINARY_ITERATIONS = 36;
const MAX_PROJECTION_DISTANCE = 0.75;
const MAX_ARC_VERTICES = 4096;
const MIN_ARC_PATH_LENGTH = 0;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [
  start[0] + (end[0] - start[0]) * fraction,
  start[1] + (end[1] - start[1]) * fraction,
];
const isPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  if (denominator <= EPS) return { point: [...start], fraction: 0, distance: distance(point, start) };
  const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const projected = [start[0] + dx * fraction, start[1] + dy * fraction];
  return { point: projected, fraction, distance: distance(point, projected) };
}

function ringsForLake(lake) { return lake?.rings ?? (lake?.coordinates ? [lake.coordinates] : []); }

function buildBoundaryDescriptors() {
  const result = [];
  for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) {
    for (const [ringIndex, ring] of ringsForLake(lake).entries()) {
      if (Array.isArray(ring) && ring.length >= 3) result.push({ kind: "lake", boundary: ring, lake, lakeIndex, ringIndex });
    }
  }
  for (const [landIndex, boundary] of PHYSICAL_LAND_POLYGONS.entries()) {
    if (Array.isArray(boundary) && boundary.length >= 3) result.push({ kind: "land", boundary, landIndex });
  }
  return result;
}

const BOUNDARIES = buildBoundaryDescriptors();

function boundaryCandidates(point) {
  const candidates = [];
  for (const descriptor of BOUNDARIES) {
    for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) {
      const start = descriptor.boundary[segmentIndex];
      const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length];
      const projection = nearestPointOnSegment(point, start, end);
      if (projection.distance <= MAX_PROJECTION_DISTANCE) {
        candidates.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance });
      }
    }
  }
  return candidates.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) > GEOMETRY_EPS) return a.distance - b.distance;
    if (a.kind !== b.kind) return a.kind === "lake" ? -1 : 1;
    return 0;
  });
}

function transitionBoundary(point) {
  if (isFinalPhysicalGeometryBoundaryPoint(point)) {
    const lake = nearestLakeBoundaryPoint(point);
    if (lake.point && lake.distance <= 1e-7) {
      const candidate = boundaryCandidates(point).find((item) => item.kind === "lake" && item.distance <= 1e-7);
      if (candidate) return candidate;
    }
    const candidate = boundaryCandidates(point)[0];
    if (candidate) return candidate;
  }
  const lake = nearestLakeBoundaryPoint(point);
  if (lake.point && lake.distance <= 0.0005) {
    const candidate = boundaryCandidates(lake.point).find((item) => item.kind === "lake");
    if (candidate) return candidate;
  }
  return boundaryCandidates(point)[0] ?? null;
}

function pathIsPhysical(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segments = Math.max(16, Math.ceil(distance(start, end) / 0.005));
    for (let sampleIndex = 1; sampleIndex < segments; sampleIndex += 1) {
      if (!isPhysicalPoint(sample(start, end, sampleIndex / segments))) return false;
    }
  }
  return true;
}

function boundaryArcCandidates(from, to) {
  if (!from || !to || from.boundary !== to.boundary) return [];
  const boundary = from.boundary;
  const count = boundary.length;
  const forward = [from.point];
  let index = (from.segmentIndex + 1) % count;
  let guard = 0;
  while (index !== (to.segmentIndex + 1) % count && guard <= count && forward.length <= MAX_ARC_VERTICES) {
    forward.push(boundary[index]);
    index = (index + 1) % count;
    guard += 1;
  }
  forward.push(to.point);

  const backward = [from.point];
  index = from.segmentIndex;
  guard = 0;
  while (index !== to.segmentIndex && guard <= count && backward.length <= MAX_ARC_VERTICES) {
    backward.push(boundary[index]);
    index = (index - 1 + count) % count;
    guard += 1;
  }
  backward.push(to.point);
  return [forward, backward];
}

function pathLength(path) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]);
  return total;
}

function connectBoundaryPoints(fromPoint, toPoint) {
  const fromCandidates = boundaryCandidates(fromPoint).slice(0, 12);
  const toCandidates = boundaryCandidates(toPoint).slice(0, 12);
  const candidates = [];

  for (const from of fromCandidates) {
    for (const to of toCandidates) {
      if (from.boundary === to.boundary) {
        for (const arc of boundaryArcCandidates(from, to)) {
          if (arc.length <= MAX_ARC_VERTICES && pathIsPhysical(arc)) candidates.push(arc);
        }
      } else {
        const direct = [from.point, to.point];
        if (pathIsPhysical(direct)) candidates.push(direct);
      }
    }
  }
  return candidates
    .filter((candidate) => pathLength(candidate) >= MIN_ARC_PATH_LENGTH)
    .sort((a, b) => pathLength(a) - pathLength(b))[0] ?? null;
}

function refineTransition(start, end, leftFraction, rightFraction) {
  let left = leftFraction;
  let right = rightFraction;
  const leftValid = isPhysicalPoint(sample(start, end, left));
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (left + right) / 2;
    const valid = isPhysicalPoint(sample(start, end, midpoint));
    if (valid === leftValid) left = midpoint;
    else right = midpoint;
  }
  return (left + right) / 2;
}

function traceTransitions(start, end) {
  const states = [];
  for (let index = 0; index <= EDGE_SAMPLES; index += 1) {
    const fraction = index / EDGE_SAMPLES;
    states.push({ fraction, valid: isPhysicalPoint(sample(start, end, fraction)) });
  }
  const transitions = [];
  for (let index = 0; index < states.length - 1; index += 1) {
    const current = states[index];
    const next = states[index + 1];
    if (current.valid === next.valid) continue;
    const fraction = refineTransition(start, end, current.fraction, next.fraction);
    transitions.push({
      fraction,
      point: sample(start, end, fraction),
      entersInvalid: current.valid && !next.valid,
    });
  }
  return transitions;
}

function appendUnique(target, points) {
  for (const point of points) {
    const previous = target[target.length - 1];
    if (!previous || distance(previous, point) > GEOMETRY_EPS) target.push([...point]);
  }
}

function repairInvalidIntervals(start, end) {
  const transitions = traceTransitions(start, end);
  if (transitions.length === 0) return pathIsPhysical([start, end]) ? [start, end] : null;

  const repaired = [];
  let cursor = start;
  let cursorFraction = 0;
  let index = 0;

  if (!isPhysicalPoint(start)) {
    const boundary = transitionBoundary(start);
    if (!boundary) return null;
    cursor = boundary.point;
    cursorFraction = 0;
    appendUnique(repaired, [cursor]);
  } else {
    appendUnique(repaired, [start]);
  }

  while (index < transitions.length) {
    const entry = transitions[index];
    if (!entry.entersInvalid) {
      index += 1;
      continue;
    }
    const exit = transitions[index + 1];
    if (!exit || exit.entersInvalid) return null;

    const entryBoundary = transitionBoundary(entry.point);
    const exitBoundary = transitionBoundary(exit.point);
    if (!entryBoundary || !exitBoundary) return null;

    const beforeEntry = sample(start, end, entry.fraction);
    const afterExit = sample(start, end, exit.fraction);
    const lead = pathIsPhysical([cursor, beforeEntry]) ? [cursor, beforeEntry] : connectBoundaryPoints(cursor, entryBoundary.point);
    if (!lead) return null;
    appendUnique(repaired, lead.slice(1));
    appendUnique(repaired, [entryBoundary.point]);

    const shoreline = connectBoundaryPoints(entryBoundary.point, exitBoundary.point);
    if (!shoreline) return null;
    appendUnique(repaired, shoreline.slice(1));

    const tail = pathIsPhysical([exitBoundary.point, afterExit]) ? [exitBoundary.point, afterExit] : connectBoundaryPoints(exitBoundary.point, afterExit);
    if (!tail) return null;
    appendUnique(repaired, tail.slice(1));

    cursor = afterExit;
    cursorFraction = exit.fraction;
    index += 2;
  }

  if (cursorFraction < 1 - EPS) {
    if (!pathIsPhysical([cursor, end])) return null;
    appendUnique(repaired, [end]);
  }
  return pathIsPhysical(repaired) ? repaired : null;
}

function normalizeEndpoint(point) {
  if (isPhysicalPoint(point)) return [...point];
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (resolved && isPhysicalPoint(resolved)) return [...resolved];
  const candidate = boundaryCandidates(point)[0];
  return candidate ? [...candidate.point] : null;
}

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return sum / 2;
}

export function repairPhysicalPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  if (polygon.every(isPhysicalPoint) && polygon.every((point, index) => pathIsPhysical([point, polygon[(index + 1) % polygon.length]]))) return polygon;

  const normalized = polygon.map(normalizeEndpoint);
  if (normalized.some((point) => !point)) throw new Error("No authoritative physical boundary candidate exists for a polygon vertex.");

  const repaired = [];
  for (let index = 0; index < normalized.length; index += 1) {
    const start = normalized[index];
    const end = normalized[(index + 1) % normalized.length];
    const edge = pathIsPhysical([start, end]) ? [start, end] : repairInvalidIntervals(start, end);
    if (!edge) {
      throw new Error(`Physical edge recovery failed at edge ${index} (${start.join(",")} → ${end.join(",")}).`);
    }
    appendUnique(repaired, edge.slice(0, -1));
  }
  appendUnique(repaired, [normalized[0]]);
  if (signedArea(repaired) === 0 || repaired.length < 3 || !repaired.every(isPhysicalPoint)) {
    throw new Error("Physical polygon repair produced degenerate or non-physical geometry.");
  }
  return repaired;
}
