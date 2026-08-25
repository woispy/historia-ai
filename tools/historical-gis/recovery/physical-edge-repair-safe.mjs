import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const GEOMETRY_EPS = 1e-8;
const EDGE_SAMPLES = 512;
const BINARY_ITERATIONS = 32;
const MAX_PROJECTION_DISTANCE = 0.02;
const MAX_ARC_VERTICES = 2048;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [
  start[0] + (end[0] - start[0]) * fraction,
  start[1] + (end[1] - start[1]) * fraction,
];
const isValidPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);

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

function projectToBoundary(point) {
  let best = null;
  for (const descriptor of BOUNDARIES) {
    for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) {
      const start = descriptor.boundary[segmentIndex];
      const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length];
      const projection = nearestPointOnSegment(point, start, end);
      if (!best || projection.distance < best.distance) best = { ...descriptor, segmentIndex, point: projection.point, distance: projection.distance };
    }
  }
  return best && best.distance <= MAX_PROJECTION_DISTANCE ? best : null;
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
  while (index !== (to.segmentIndex + 1) % count && guard <= count && forward.length <= MAX_ARC_VERTICES) { forward.push(boundary[index]); index = (index + 1) % count; guard += 1; }
  forward.push(to.point);
  const backward = [from.point];
  index = from.segmentIndex;
  guard = 0;
  while (index !== to.segmentIndex && guard <= count && backward.length <= MAX_ARC_VERTICES) { backward.push(boundary[index]); index = (index - 1 + count) % count; guard += 1; }
  backward.push(to.point);
  return [forward, backward];
}

function sameBoundary(a, b) {
  if (!a || !b || a.boundary !== b.boundary) return false;
  if (a.kind === "lake" || b.kind === "lake") return a.kind === b.kind && a.lake === b.lake && a.ringIndex === b.ringIndex;
  return true;
}

function pathLength(path) { return path.reduce((total, point, index) => index === 0 ? total : total + distance(path[index - 1], point), 0); }

function chooseBoundaryPath(fromPoint, toPoint) {
  const from = projectToBoundary(fromPoint);
  const to = projectToBoundary(toPoint);
  if (!from || !to) return null;
  if (sameBoundary(from, to)) return arcCandidates(from.boundary, from, to).filter(isValidPhysicalPath).sort((a, b) => pathLength(a) - pathLength(b))[0] ?? null;
  const direct = [from.point, to.point];
  return isValidPhysicalPath(direct) ? direct : null;
}

function appendUnique(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || distance(last, point) > GEOMETRY_EPS) target.push(point);
  }
}

function fallbackEdge(start, end) {
  if (isValidPhysicalPath([start, end])) return [start, end];
  const transitions = waterTransitions(start, end);
  if (transitions.length < 2 || transitions.length % 2 !== 0) return null;
  const repaired = [start];
  let cursor = start;
  for (let index = 0; index < transitions.length; index += 2) {
    const entry = transitions[index];
    const exit = transitions[index + 1];
    if (!entry.entersWater || exit.entersWater) return null;
    const entryBoundary = resolvePhysicalGeometryBoundaryPoint(entry.point);
    const exitBoundary = resolvePhysicalGeometryBoundaryPoint(exit.point);
    if (!entryBoundary || !exitBoundary || !isValidPhysicalPath([cursor, entryBoundary])) return null;
    appendUnique(repaired, [entryBoundary]);
    const boundaryPath = chooseBoundaryPath(entryBoundary, exitBoundary);
    if (!boundaryPath) return null;
    appendUnique(repaired, boundaryPath.slice(1));
    cursor = exitBoundary;
  }
  if (!isValidPhysicalPath([cursor, end])) return null;
  appendUnique(repaired, [end]);
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
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const edge = fallbackEdge(start, end);
    if (!edge) return null;
    appendUnique(repaired, edge.slice(0, -1));
  }
  appendUnique(repaired, [polygon[0]]);
  return isValidPhysicalPath(repaired) ? repaired : null;
}

export function repairPhysicalPolygon(polygon) {
  // Phase 2D cells already form a topological partition. Legacy whole-polygon
  // recovery can move valid partition edges toward unrelated physical
  // boundaries and thereby create overlap with a neighboring cell. Keep repair
  // edge-local and refuse topology-changing fallback.
  const edgeWise = repairEdgesWithoutMutatingValidEdges(polygon);
  if (edgeWise) return edgeWise;
  try {
    const normalized = normalizeVertices(polygon);
    const repaired = repairEdgesWithoutMutatingValidEdges(normalized);
    if (repaired) return repaired;
  } catch {
    // Fall through to a deterministic diagnostic error below.
  }
  throw new Error("Physical polygon repair would require mutating a valid partition edge; refusing topology-changing recovery.");
}