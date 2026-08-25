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
const BEAM_WIDTH = 32;
const MIN_REPAIR_AREA_RATIO = 0.05;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
const isPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  if (denominator <= EPS) return { point: [...start], distance: distance(point, start) };
  const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const projected = [start[0] + dx * fraction, start[1] + dy * fraction];
  return { point: projected, distance: distance(point, projected) };
}
function pointToSegmentDistance(point, start, end) { return nearestPointOnSegment(point, start, end).distance; }
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
      if (projection.distance <= MAX_PROJECTION_DISTANCE) candidates.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance);
}

function transitionBoundary(point) {
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
    forward.push(boundary[index]); index = (index + 1) % count; guard += 1;
  }
  forward.push(to.point);
  const backward = [from.point];
  index = from.segmentIndex; guard = 0;
  while (index !== to.segmentIndex && guard <= count && backward.length <= MAX_ARC_VERTICES) {
    backward.push(boundary[index]); index = (index - 1 + count) % count; guard += 1;
  }
  backward.push(to.point);
  return [forward, backward].filter((path) => path.length <= MAX_ARC_VERTICES && pathIsPhysical(path));
}
function pathLength(path) { let total = 0; for (let i = 1; i < path.length; i += 1) total += distance(path[i - 1], path[i]); return total; }
function pathDeviation(path, sourceStart, sourceEnd) {
  let total = 0; let maximum = 0;
  for (const point of path) { const value = pointToSegmentDistance(point, sourceStart, sourceEnd); total += value; maximum = Math.max(maximum, value); }
  return total / path.length + maximum * 0.25;
}
function rankedBoundaryArcs(from, to, sourceStart, sourceEnd) {
  return boundaryArcCandidates(from, to).sort((a, b) => {
    const deviation = pathDeviation(a, sourceStart, sourceEnd) - pathDeviation(b, sourceStart, sourceEnd);
    return Math.abs(deviation) > GEOMETRY_EPS ? deviation : pathLength(a) - pathLength(b);
  });
}
function connectToBoundaryCandidates(point, target, sourceStart, sourceEnd) {
  if (!target) return [];
  if (pathIsPhysical([point, target.point])) return [[point, target.point]];
  const result = [];
  for (const projection of boundaryCandidates(point).filter((candidate) => candidate.boundary === target.boundary).slice(0, 8)) {
    if (!pathIsPhysical([point, projection.point])) continue;
    for (const arc of rankedBoundaryArcs(projection, target, sourceStart, sourceEnd).slice(0, 2)) result.push([[...point], ...arc]);
  }
  return result;
}
function refineTransition(start, end, leftFraction, rightFraction) {
  let left = leftFraction; let right = rightFraction;
  const leftValid = isPhysicalPoint(sample(start, end, left));
  for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (left + right) / 2;
    if (isPhysicalPoint(sample(start, end, midpoint)) === leftValid) left = midpoint; else right = midpoint;
  }
  return (left + right) / 2;
}
function traceTransitions(start, end) {
  const states = [];
  for (let index = 0; index <= EDGE_SAMPLES; index += 1) { const fraction = index / EDGE_SAMPLES; states.push({ fraction, valid: isPhysicalPoint(sample(start, end, fraction)) }); }
  const transitions = [];
  for (let index = 0; index < states.length - 1; index += 1) {
    if (states[index].valid === states[index + 1].valid) continue;
    const fraction = refineTransition(start, end, states[index].fraction, states[index + 1].fraction);
    transitions.push({ fraction, point: sample(start, end, fraction), entersInvalid: states[index].valid && !states[index + 1].valid });
  }
  return transitions;
}
function appendUnique(target, points) { for (const point of points) { const previous = target[target.length - 1]; if (!previous || distance(previous, point) > GEOMETRY_EPS) target.push([...point]); } }

function repairInvalidIntervalsCandidates(start, end) {
  const transitions = traceTransitions(start, end);
  if (!transitions.length) return pathIsPhysical([start, end]) ? [[start, end]] : [];
  let partials = [{ path: [start], cursor: start, cursorFraction: 0 }];
  for (let index = 0; index < transitions.length; index += 2) {
    const entry = transitions[index]; const exit = transitions[index + 1];
    if (!entry?.entersInvalid || !exit || exit.entersInvalid) return [];
    const entryBoundary = transitionBoundary(entry.point); const exitBoundary = transitionBoundary(exit.point);
    if (!entryBoundary || !exitBoundary) return [];
    const beforeEntry = sample(start, end, entry.fraction); const afterExit = sample(start, end, exit.fraction);
    const next = [];
    for (const partial of partials) {
      const leadBase = pathIsPhysical([partial.cursor, beforeEntry]) ? [[partial.cursor, beforeEntry]] : [];
      const leadBridges = pathIsPhysical([beforeEntry, entryBoundary.point]) ? [[beforeEntry, entryBoundary.point]] : connectToBoundaryCandidates(beforeEntry, entryBoundary, start, end);
      const leads = [];
      for (const lead of leadBase.length ? leadBase : connectToBoundaryCandidates(partial.cursor, entryBoundary, start, end)) {
        if (leadBase.length) { for (const bridge of leadBridges) leads.push([...lead.slice(0, -1), ...bridge]); }
        else leads.push(lead);
      }
      for (const lead of leads) {
        let shorelines = entryBoundary.boundary === exitBoundary.boundary ? rankedBoundaryArcs(entryBoundary, exitBoundary, start, end).slice(0, 2) : [];
        if (!shorelines.length && pathIsPhysical([entryBoundary.point, exitBoundary.point])) shorelines = [[entryBoundary.point, exitBoundary.point]];
        for (const shoreline of shorelines) {
          const tailDirect = pathIsPhysical([exitBoundary.point, afterExit]) ? [[exitBoundary.point, afterExit]] : [];
          const tailBridges = tailDirect.length ? tailDirect : connectToBoundaryCandidates(afterExit, exitBoundary, start, end).map((path) => [...path].reverse());
          for (const tail of tailBridges) {
            const path = [...partial.path]; appendUnique(path, lead.slice(1)); appendUnique(path, shoreline.slice(1)); appendUnique(path, tail.slice(1));
            if (pathIsPhysical(path)) next.push({ path, cursor: afterExit, cursorFraction: exit.fraction });
          }
        }
      }
    }
    partials = next.sort((a, b) => pathDeviation(a.path, start, end) - pathDeviation(b.path, start, end)).slice(0, BEAM_WIDTH);
    if (!partials.length) return [];
  }
  return partials.map((partial) => { const path = [...partial.path]; if (partial.cursorFraction < 1 - EPS) { if (!pathIsPhysical([partial.cursor, end])) return null; appendUnique(path, [end]); } return pathIsPhysical(path) ? path : null; }).filter(Boolean);
}

function normalizeEndpoint(point) {
  if (isPhysicalPoint(point)) return [...point];
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (resolved && isPhysicalPoint(resolved)) return [...resolved];
  const candidate = boundaryCandidates(point)[0];
  return candidate ? [...candidate.point] : null;
}
function signedArea(polygon) { let sum = 0; for (let index = 0; index < polygon.length; index += 1) { const current = polygon[index]; const next = polygon[(index + 1) % polygon.length]; sum += current[0] * next[1] - next[0] * current[1]; } return sum / 2; }
function candidateScore(polygon, originalArea) { const area = Math.abs(signedArea(polygon)); if (!area || !polygon.every(isPhysicalPoint)) return Infinity; return (originalArea > 0 ? Math.abs(Math.log(area / originalArea)) : 0) + polygon.length * 1e-5; }

export function repairPhysicalPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  const originalArea = Math.abs(signedArea(polygon));
  if (polygon.every(isPhysicalPoint) && polygon.every((point, index) => pathIsPhysical([point, polygon[(index + 1) % polygon.length]]))) return polygon;
  const normalized = polygon.map(normalizeEndpoint);
  if (normalized.some((point) => !point)) throw new Error("No authoritative physical boundary candidate exists for a polygon vertex.");

  let beam = [{ polygon: [], score: 0 }];
  for (let index = 0; index < normalized.length; index += 1) {
    const start = normalized[index]; const end = normalized[(index + 1) % normalized.length];
    const edgeCandidates = pathIsPhysical([start, end]) ? [[start, end]] : repairInvalidIntervalsCandidates(start, end);
    if (!edgeCandidates.length) throw new Error(`Physical edge recovery failed at edge ${index} (${start.join(",")} → ${end.join(",")}).`);
    const next = [];
    for (const state of beam) for (const edge of edgeCandidates) { const candidate = [...state.polygon]; appendUnique(candidate, edge.slice(0, -1)); next.push({ polygon: candidate, score: state.score + pathDeviation(edge, start, end) }); }
    beam = next.sort((a, b) => a.score - b.score).slice(0, BEAM_WIDTH);
  }

  const candidates = beam.map((state) => { const polygonCandidate = [...state.polygon]; appendUnique(polygonCandidate, [normalized[0]]); return { polygon: polygonCandidate, score: candidateScore(polygonCandidate, originalArea), area: Math.abs(signedArea(polygonCandidate)) }; }).filter((item) => Number.isFinite(item.score));
  const best = candidates.filter((item) => originalArea === 0 || item.area >= originalArea * MIN_REPAIR_AREA_RATIO).sort((a, b) => a.score - b.score)[0];
  if (!best) throw new Error("Physical polygon repair produced only degenerate or non-physical candidates.");
  return best.polygon;
}
