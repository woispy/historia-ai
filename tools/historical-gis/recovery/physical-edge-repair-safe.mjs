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
const EDGE_SAMPLES = 512;
const BINARY_ITERATIONS = 32;
const MAX_PROJECTION_DISTANCE = 0.02;
const MAX_ARC_VERTICES = 2048;
const INTERIOR_SIDE_TOLERANCE = 1e-8;
const LAKE_SHORELINE_TRANSITION_TOLERANCE = 0.0002;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [
  start[0] + (end[0] - start[0]) * fraction,
  start[1] + (end[1] - start[1]) * fraction,
];
const isValidPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return sum / 2;
}

function edgeCross(start, end, point) {
  return (end[0] - start[0]) * (point[1] - start[1])
    - (end[1] - start[1]) * (point[0] - start[0]);
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

function ringsForLake(lake) { return lake?.rings ?? (lake?.coordinates ? [lake.coordinates] : []); }

function boundaryDescriptors() {
  const result = [];
  for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) {
    for (const [ringIndex, ring] of ringsForLake(lake).entries()) {
      if (Array.isArray(ring) && ring.length >= 3) result.push({ kind: "lake", boundary: ring, lake, lakeIndex, ringIndex });
    }
  }
  for (const [landIndex, polygon] of PHYSICAL_LAND_POLYGONS.entries()) {
    if (Array.isArray(polygon) && polygon.length >= 3) result.push({ kind: "land", boundary: polygon, landIndex });
  }
  return result;
}

const BOUNDARIES = boundaryDescriptors();

function projectToBoundaryCandidates(point, originalStart, originalEnd, interiorSign) {
  const candidates = [];
  for (const descriptor of BOUNDARIES) {
    for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) {
      const start = descriptor.boundary[segmentIndex];
      const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length];
      const projection = nearestPointOnSegment(point, start, end);
      if (projection.distance > MAX_PROJECTION_DISTANCE) continue;
      const side = edgeCross(originalStart, originalEnd, projection.point) * interiorSign;
      if (side < -INTERIOR_SIDE_TOLERANCE && descriptor.kind !== "lake") continue;
      candidates.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance);
}

function exactBoundaryCandidates(point) {
  const candidates = [];
  for (const descriptor of BOUNDARIES) {
    for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) {
      const start = descriptor.boundary[segmentIndex];
      const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length];
      const projection = nearestPointOnSegment(point, start, end);
      const tolerance = GEOMETRY_EPS * Math.max(1, distance(start, end));
      if (projection.distance <= tolerance) candidates.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance);
}

function isValidPhysicalPath(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const samples = Math.max(16, Math.ceil(distance(start, end) / 0.01));
    for (let sampleIndex = 1; sampleIndex < samples; sampleIndex += 1) {
      if (!isValidPhysicalPoint(sample(start, end, sampleIndex / samples))) return false;
    }
  }
  return true;
}

function isPointOnSourceEdge(point, start, end) {
  const projection = nearestPointOnSegment(point, start, end);
  const scale = Math.max(1, distance(start, end));
  return projection.distance <= GEOMETRY_EPS * scale;
}

function sourceEdgeFraction(point, start, end) { return nearestPointOnSegment(point, start, end).fraction; }

function sourceEdgeSubpathIsValid(fromPoint, toPoint, start, end) {
  if (!isPointOnSourceEdge(fromPoint, start, end) || !isPointOnSourceEdge(toPoint, start, end)) return false;
  const fromFraction = sourceEdgeFraction(fromPoint, start, end);
  const toFraction = sourceEdgeFraction(toPoint, start, end);
  if (Math.abs(fromFraction - toFraction) <= EPS) return true;
  const orderedStart = fromFraction <= toFraction ? fromPoint : toPoint;
  const orderedEnd = fromFraction <= toFraction ? toPoint : fromPoint;
  return isValidPhysicalPath([orderedStart, orderedEnd]);
}

function refineTransition(start, end, validFraction, invalidFraction) {
  let valid = validFraction;
  let invalid = invalidFraction;
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (valid + invalid) / 2;
    if (isValidPhysicalPoint(sample(start, end, midpoint))) valid = midpoint;
    else invalid = midpoint;
  }
  return (valid + invalid) / 2;
}

function waterTransitions(start, end) {
  const states = [];
  for (let index = 0; index <= EDGE_SAMPLES; index += 1) {
    const fraction = index / EDGE_SAMPLES;
    states.push({ fraction, valid: isValidPhysicalPoint(sample(start, end, fraction)) });
  }
  const transitions = [];
  for (let index = 0; index < states.length - 1; index += 1) {
    const current = states[index];
    const next = states[index + 1];
    if (current.valid === next.valid) continue;
    const validFraction = current.valid ? current.fraction : next.fraction;
    const invalidFraction = current.valid ? next.fraction : current.fraction;
    const fraction = refineTransition(start, end, validFraction, invalidFraction);
    transitions.push({ fraction, point: sample(start, end, fraction), entersWater: current.valid && !next.valid });
  }
  return transitions;
}

function arcCandidates(boundary, from, to) {
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

function sameBoundary(a, b) {
  if (!a || !b || a.boundary !== b.boundary) return false;
  if (a.kind === "lake" || b.kind === "lake") return a.kind === b.kind && a.lake === b.lake && a.ringIndex === b.ringIndex;
  return true;
}

function pathLength(path) { return path.reduce((total, point, index) => index === 0 ? total : total + distance(path[index - 1], point), 0); }

function chooseBoundaryPath(fromPoint, toPoint, originalStart, originalEnd, interiorSign) {
  const exactFromCandidates = exactBoundaryCandidates(fromPoint);
  const exactToCandidates = exactBoundaryCandidates(toPoint);
  const fromCandidates = [...exactFromCandidates, ...projectToBoundaryCandidates(fromPoint, originalStart, originalEnd, interiorSign)];
  const toCandidates = [...exactToCandidates, ...projectToBoundaryCandidates(toPoint, originalStart, originalEnd, interiorSign)];
  if (fromCandidates.length === 0 || toCandidates.length === 0) return null;
  const pathIsAllowed = (path, boundaryDescriptor = null) => {
    if (!isValidPhysicalPath(path)) return false;
    // Every authoritative physical boundary is allowed to replace the invalid
    // portion of a partition edge. The source edge is still preserved whenever
    // it is already physically valid; only the invalid interval is redirected.
    if (boundaryDescriptor?.kind === "lake" || boundaryDescriptor?.kind === "land") return true;
    return path.every((point) => edgeCross(originalStart, originalEnd, point) * interiorSign >= -INTERIOR_SIDE_TOLERANCE);
  };
  const candidates = [];
  for (const from of fromCandidates) {
    for (const to of toCandidates) {
      if (sameBoundary(from, to)) {
        for (const path of arcCandidates(from.boundary, from, to)) {
          if (pathIsAllowed(path, from)) candidates.push(path);
        }
      } else {
        const direct = [from.point, to.point];
        if (pathIsAllowed(direct)) candidates.push(direct);
      }
      if (candidates.length >= 16) break;
    }
    if (candidates.length >= 16) break;
  }
  return candidates.sort((a, b) => pathLength(a) - pathLength(b))[0] ?? null;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function resolveTransitionBoundary(point) {
  if (isFinalPhysicalGeometryBoundaryPoint(point)) return [...point];
  const lake = nearestLakeBoundaryPoint(point);
  if (lake.point && lake.distance <= LAKE_SHORELINE_TRANSITION_TOLERANCE) return [...lake.point];
  return resolvePhysicalGeometryBoundaryPoint(point);
}

function normalizeRepairEndpoint(point, originalStart, originalEnd, interiorSign) {
  if (isValidPhysicalPoint(point)) return [...point];
  const candidates = projectToBoundaryCandidates(point, originalStart, originalEnd, interiorSign);
  if (candidates.length) return [...candidates[0].point];
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (!resolved) return null;
  return edgeCross(originalStart, originalEnd, resolved) * interiorSign >= -INTERIOR_SIDE_TOLERANCE ? [...resolved] : null;
}

function connectPhysicalPoints(fromPoint, toPoint, originalStart, originalEnd, interiorSign) {
  if (sourceEdgeSubpathIsValid(fromPoint, toPoint, originalStart, originalEnd)) return [fromPoint, toPoint];
  if (isValidPhysicalPath([fromPoint, toPoint])) return [fromPoint, toPoint];
  return chooseBoundaryPath(fromPoint, toPoint, originalStart, originalEnd, interiorSign);
}

function fallbackEdge(start, end, interiorSign) {
  let workingStart = start;
  let workingEnd = end;
  if (!isValidPhysicalPoint(workingStart)) {
    workingStart = normalizeRepairEndpoint(workingStart, start, end, interiorSign);
    if (!workingStart) return null;
  }
  if (!isValidPhysicalPoint(workingEnd)) {
    workingEnd = normalizeRepairEndpoint(workingEnd, start, end, interiorSign);
    if (!workingEnd) return null;
  }
  if (isValidPhysicalPath([workingStart, workingEnd])) return [workingStart, workingEnd];
  const transitions = waterTransitions(workingStart, workingEnd);
  if (transitions.length < 2 || transitions.length % 2 !== 0) return null;
  const repaired = [workingStart];
  let cursor = workingStart;
  for (let index = 0; index < transitions.length; index += 2) {
    const entry = transitions[index];
    const exit = transitions[index + 1];
    if (!entry.entersWater || exit.entersWater) return null;
    const entryBoundary = resolveTransitionBoundary(entry.point);
    const exitBoundary = resolveTransitionBoundary(exit.point);
    if (!entryBoundary || !exitBoundary) return null;
    const entryPath = connectPhysicalPoints(cursor, entryBoundary, start, end, interiorSign);
    if (!entryPath) return null;
    appendUnique(repaired, entryPath.slice(1));
    const boundaryPath = chooseBoundaryPath(entryBoundary, exitBoundary, start, end, interiorSign);
    if (!boundaryPath) return null;
    appendUnique(repaired, boundaryPath.slice(1));
    cursor = exitBoundary;
  }
  const finalPath = connectPhysicalPoints(cursor, workingEnd, start, end, interiorSign);
  if (!finalPath) return null;
  appendUnique(repaired, finalPath.slice(1));
  return isValidPhysicalPath(repaired) ? repaired : null;
}

function normalizeVertices(polygon) {
  return polygon.map((point) => {
    if (isValidPhysicalPoint(point)) return [...point];
    const resolved = resolvePhysicalGeometryBoundaryPoint(point);
    if (!resolved) throw new Error(`No strict physical recovery candidate for polygon vertex: ${point.join(",")}`);
    return [...resolved];
  });
}

function repairEdgesWithoutMutatingValidEdges(polygon) {
  const repaired = [];
  const orientation = signedArea(polygon);
  const interiorSign = orientation >= 0 ? 1 : -1;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const edge = fallbackEdge(start, end, interiorSign);
    if (!edge) return null;
    appendUnique(repaired, edge.slice(0, -1));
  }
  appendUnique(repaired, [polygon[0]]);
  return isValidPhysicalPath(repaired) ? repaired : null;
}

export function repairPhysicalPolygon(polygon) {
  const edgeWise = repairEdgesWithoutMutatingValidEdges(polygon);
  if (edgeWise) return edgeWise;
  try {
    const normalized = normalizeVertices(polygon);
    const repaired = repairEdgesWithoutMutatingValidEdges(normalized);
    if (repaired) return repaired;
  } catch {
    // Fall through to the deterministic diagnostic error below.
  }
  throw new Error("Physical polygon repair would require mutating a valid partition edge; refusing topology-changing recovery.");
}