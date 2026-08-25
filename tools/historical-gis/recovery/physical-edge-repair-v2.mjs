import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  nearestLakeBoundaryPoint,
  resolvePhysicalGeometryBoundaryPointStrict,
} from "./physical-land-authority.mjs";

const EPS = 1e-10;
const GEOMETRY_EPS = 1e-8;
const EDGE_SAMPLES = 2048;
const BINARY_ITERATIONS = 36;
const MAX_PROJECTION_DISTANCE = 0.75;
const MAX_ARC_VERTICES = 4096;
const BEAM_WIDTH = 32;
const MIN_REPAIR_AREA_RATIO = 0.05;
const TRANSITION_MATCH_TOLERANCE = 0.02;
const INTERIOR_SIDE_TOLERANCE = 1e-8;
const MAX_LAND_ARC_LENGTH_RATIO = 6;
const SOURCE_CELL_BUFFER = 0.03;

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sample = (start, end, fraction) => [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
const isPhysicalPoint = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
function edgeCross(start, end, point) { return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]); }
function nearestPointOnSegment(point, start, end) { const dx = end[0] - start[0]; const dy = end[1] - start[1]; const denominator = dx * dx + dy * dy; if (denominator <= EPS) return { point: [...start], fraction: 0, distance: distance(point, start) }; const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator)); const projected = [start[0] + dx * fraction, start[1] + dy * fraction]; return { point: projected, fraction, distance: distance(point, projected) }; }
function pointToSegmentDistance(point, start, end) { return nearestPointOnSegment(point, start, end).distance; }
function ringsForLake(lake) { return lake?.rings ?? (lake?.coordinates ? [lake.coordinates] : []); }
function buildBoundaryDescriptors() { const result = []; for (const [lakeIndex, lake] of AUTHORITATIVE_LAKES.entries()) for (const [ringIndex, ring] of ringsForLake(lake).entries()) if (Array.isArray(ring) && ring.length >= 3) result.push({ kind: "lake", boundary: ring, lake, lakeIndex, ringIndex }); for (const [landIndex, boundary] of PHYSICAL_LAND_POLYGONS.entries()) if (Array.isArray(boundary) && boundary.length >= 3) result.push({ kind: "land", boundary, landIndex }); return result; }
const BOUNDARIES = buildBoundaryDescriptors();
function boundaryCandidates(point) { const candidates = []; for (const descriptor of BOUNDARIES) for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) { const start = descriptor.boundary[segmentIndex]; const end = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length]; const projection = nearestPointOnSegment(point, start, end); if (projection.distance <= MAX_PROJECTION_DISTANCE) candidates.push({ ...descriptor, segmentIndex, point: projection.point, distance: projection.distance }); } return candidates.sort((a, b) => a.distance - b.distance); }
function boundaryCrossings(start, end) { const result = []; const r = [end[0] - start[0], end[1] - start[1]]; for (const descriptor of BOUNDARIES) for (let segmentIndex = 0; segmentIndex < descriptor.boundary.length; segmentIndex += 1) { const boundaryStart = descriptor.boundary[segmentIndex]; const boundaryEnd = descriptor.boundary[(segmentIndex + 1) % descriptor.boundary.length]; const s = [boundaryEnd[0] - boundaryStart[0], boundaryEnd[1] - boundaryStart[1]]; const denominator = r[0] * s[1] - r[1] * s[0]; if (Math.abs(denominator) <= EPS) continue; const q = [boundaryStart[0] - start[0], boundaryStart[1] - start[1]]; const fraction = (q[0] * s[1] - q[1] * s[0]) / denominator; const boundaryFraction = (q[0] * r[1] - q[1] * r[0]) / denominator; if (fraction < -EPS || fraction > 1 + EPS || boundaryFraction < -EPS || boundaryFraction > 1 + EPS) continue; const clampedFraction = Math.max(0, Math.min(1, fraction)); const point = sample(start, end, clampedFraction); if (!isPhysicalPoint(point)) continue; result.push({ ...descriptor, segmentIndex, fraction: clampedFraction, point }); } return result.sort((a, b) => a.fraction - b.fraction); }
function pointInOrOnPolygon(point, polygon) { if (!Array.isArray(polygon) || polygon.length < 3) return false; for (let index = 0; index < polygon.length; index += 1) { const start = polygon[index]; const end = polygon[(index + 1) % polygon.length]; if (pointToSegmentDistance(point, start, end) <= GEOMETRY_EPS * Math.max(1, distance(start, end))) return true; } let inside = false; for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) { const current = polygon[index]; const before = polygon[previous]; if ((current[1] > point[1]) !== (before[1] > point[1]) && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || EPS) + current[0]) inside = !inside; } return inside; }
function pathIsInsideSource(path, sourcePolygon, boundaryKind = "land") { if (!sourcePolygon) return true; if (boundaryKind === "lake") return path.every((point) => pointInOrOnPolygon(point, sourcePolygon) || sourcePolygon.some((start, index) => pointToSegmentDistance(point, start, sourcePolygon[(index + 1) % sourcePolygon.length]) <= SOURCE_CELL_BUFFER)); return path.every((point) => pointInOrOnPolygon(point, sourcePolygon)); }
function pathIsPhysical(path) { if (!Array.isArray(path) || path.length < 2) return false; for (let index = 0; index < path.length - 1; index += 1) { const start = path[index]; const end = path[index + 1]; const segments = Math.max(16, Math.ceil(distance(start, end) / 0.005)); for (let sampleIndex = 1; sampleIndex < segments; sampleIndex += 1) if (!isPhysicalPoint(sample(start, end, sampleIndex / segments))) return false; } return true; }
function pathRespectsSourceSide(path, sourceStart, sourceEnd, interiorSign) { return !interiorSign || path.every((point) => edgeCross(sourceStart, sourceEnd, point) * interiorSign >= -INTERIOR_SIDE_TOLERANCE); }
function boundaryArcCandidates(from, to, sourceStart, sourceEnd, interiorSign, sourcePolygon) {
  if (!from || !to) return [];
  const sourceLength = Math.max(distance(sourceStart, sourceEnd), GEOMETRY_EPS);
  const direct = [from.point, to.point];
  const directCandidates = from.kind === to.kind
    && pathIsPhysical(direct)
    && pathIsInsideSource(direct, sourcePolygon, from.kind)
    && (from.kind === "lake" || pathLength(direct) <= sourceLength * MAX_LAND_ARC_LENGTH_RATIO)
    && (from.kind === "lake" || pathRespectsSourceSide(direct, sourceStart, sourceEnd, interiorSign))
    ? [direct] : [];
  if (from.boundary !== to.boundary) return directCandidates;

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

  return [...directCandidates, forward, backward]
    .filter((path) => path.length <= MAX_ARC_VERTICES)
    .filter(pathIsPhysical)
    .filter((path) => pathIsInsideSource(path, sourcePolygon, from.kind))
    .filter((path) => from.kind === "lake" || pathLength(path) <= sourceLength * MAX_LAND_ARC_LENGTH_RATIO)
    .filter((path) => from.kind === "lake" || pathRespectsSourceSide(path, sourceStart, sourceEnd, interiorSign));
}
function pathLength(path) { let total = 0; for (let index = 1; index < path.length; index += 1) total += distance(path[index - 1], path[index]); return total; }
function pathDeviation(path, sourceStart, sourceEnd) { let total = 0; let maximum = 0; for (const point of path) { const value = pointToSegmentDistance(point, sourceStart, sourceEnd); total += value; maximum = Math.max(maximum, value); } return total / path.length + maximum * 0.25; }
function rankedBoundaryArcs(from, to, sourceStart, sourceEnd, interiorSign, sourcePolygon) { return boundaryArcCandidates(from, to, sourceStart, sourceEnd, interiorSign, sourcePolygon).sort((a, b) => { const deviation = pathDeviation(a, sourceStart, sourceEnd) - pathDeviation(b, sourceStart, sourceEnd); return Math.abs(deviation) > GEOMETRY_EPS ? deviation : pathLength(a) - pathLength(b); }); }
function refineTransition(start, end, leftFraction, rightFraction) { let left = leftFraction; let right = rightFraction; const leftValid = isPhysicalPoint(sample(start, end, left)); for (let iteration = 0; iteration < BINARY_ITERATIONS; iteration += 1) { const midpoint = (left + right) / 2; if (isPhysicalPoint(sample(start, end, midpoint)) === leftValid) left = midpoint; else right = midpoint; } return (left + right) / 2; }
function traceTransitions(start, end) { const states = []; for (let index = 0; index <= EDGE_SAMPLES; index += 1) { const fraction = index / EDGE_SAMPLES; states.push({ fraction, valid: isPhysicalPoint(sample(start, end, fraction)) }); } const transitions = []; for (let index = 0; index < states.length - 1; index += 1) if (states[index].valid !== states[index + 1].valid) transitions.push({ fraction: refineTransition(start, end, states[index].fraction, states[index + 1].fraction), entersInvalid: states[index].valid && !states[index + 1].valid }); return transitions; }
function appendUnique(target, points) { for (const point of points) { const previous = target[target.length - 1]; if (!previous || distance(previous, point) > GEOMETRY_EPS) target.push([...point]); } }
function boundaryPairCandidates(crossings, entryFraction, exitFraction) { const candidates = []; for (const entry of crossings) { if (Math.abs(entry.fraction - entryFraction) > TRANSITION_MATCH_TOLERANCE) continue; for (const exit of crossings) { if (Math.abs(exit.fraction - exitFraction) > TRANSITION_MATCH_TOLERANCE) continue; if (entry.kind !== exit.kind || entry.fraction >= exit.fraction) continue; candidates.push({ entry, exit }); } } return candidates.sort((a, b) => (Math.abs(a.entry.fraction - entryFraction) + Math.abs(a.exit.fraction - exitFraction)) - (Math.abs(b.entry.fraction - entryFraction) + Math.abs(b.exit.fraction))); }
function fallbackBoundaryPair(start, end, entryFraction, exitFraction) { const entryPoint = sample(start, end, entryFraction); const exitPoint = sample(start, end, exitFraction); const entryCandidates = boundaryCandidates(entryPoint).slice(0, 32); const exitCandidates = boundaryCandidates(exitPoint).slice(0, 32); const pairs = []; for (const entry of entryCandidates) for (const exit of exitCandidates) if (entry.kind === exit.kind) pairs.push({ entry, exit }); return pairs.sort((a, b) => (a.entry.distance + a.exit.distance) - (b.entry.distance + b.exit.distance)); }
function repairInvalidIntervalsCandidates(start, end, interiorSign, sourcePolygon) { const transitions = traceTransitions(start, end); if (!transitions.length) return pathIsPhysical([start, end]) ? [[start, end]] : []; const crossings = boundaryCrossings(start, end); let partials = [{ path: [start], cursorFraction: 0 }]; for (let index = 0; index < transitions.length; index += 2) { const entry = transitions[index]; const exit = transitions[index + 1]; if (!entry?.entersInvalid || !exit || exit.entersInvalid) return []; const pairs = boundaryPairCandidates(crossings, entry.fraction, exit.fraction); const candidatePairs = pairs.length ? pairs : fallbackBoundaryPair(start, end, entry.fraction, exit.fraction); if (!candidatePairs.length) return []; const next = []; for (const partial of partials) { const cursor = sample(start, end, partial.cursorFraction); for (const pair of candidatePairs.slice(0, 16)) { if (!pathIsPhysical([cursor, pair.entry.point]) || !pathIsInsideSource([pair.entry.point], sourcePolygon, pair.entry.kind)) continue; const shorelines = rankedBoundaryArcs(pair.entry, pair.exit, start, end, interiorSign, sourcePolygon).slice(0, 4); for (const shoreline of shorelines) { const path = [...partial.path]; appendUnique(path, [pair.entry.point]); appendUnique(path, shoreline.slice(1)); next.push({ path, cursorFraction: pair.exit.fraction }); } } } partials = next.filter((candidate) => pathIsPhysical(candidate.path) && pathIsInsideSource(candidate.path, sourcePolygon)).sort((a, b) => pathDeviation(a.path, start, end) - pathDeviation(b.path, start, end)).slice(0, BEAM_WIDTH); if (!partials.length) return []; } return partials.map((partial) => { const path = [...partial.path]; const cursor = sample(start, end, partial.cursorFraction); if (!pathIsPhysical([cursor, end]) || !pathIsInsideSource([cursor, end], sourcePolygon)) return null; appendUnique(path, [cursor, end]); return pathIsPhysical(path) && pathIsInsideSource(path, sourcePolygon) ? path : null; }).filter(Boolean); }
function normalizeEndpoint(point) { if (isPhysicalPoint(point)) return [...point]; const resolved = resolvePhysicalGeometryBoundaryPointStrict(point); if (resolved && isPhysicalPoint(resolved)) return [...resolved]; const candidate = boundaryCandidates(point)[0]; return candidate ? [...candidate.point] : null; }
function signedArea(polygon) { let sum = 0; for (let index = 0; index < polygon.length; index += 1) { const current = polygon[index]; const next = polygon[(index + 1) % polygon.length]; sum += current[0] * next[1] - next[0] * current[1]; } return sum / 2; }
function candidateScore(polygon, originalArea) { const area = Math.abs(signedArea(polygon)); if (!area || !polygon.every(isPhysicalPoint)) return Infinity; return (originalArea > 0 ? Math.abs(Math.log(area / originalArea)) : 0) + polygon.length * 1e-5; }
export function repairPhysicalPolygon(polygon, options = {}) { if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices."); const originalArea = Math.abs(signedArea(polygon)); const sourcePolygon = options.containmentPolygon ?? null; if (polygon.every(isPhysicalPoint) && polygon.every((point, index) => pathIsPhysical([point, polygon[(index + 1) % polygon.length]]))) return polygon; const normalized = polygon.map(normalizeEndpoint); if (normalized.some((point) => !point)) throw new Error("No authoritative physical boundary candidate exists for a polygon vertex."); const interiorSign = signedArea(normalized) >= 0 ? 1 : -1; let beam = [{ polygon: [], score: 0 }]; for (let index = 0; index < normalized.length; index += 1) { const start = normalized[index]; const end = normalized[(index + 1) % normalized.length]; const edgeCandidates = pathIsPhysical([start, end]) ? [[start, end]] : repairInvalidIntervalsCandidates(start, end, interiorSign, sourcePolygon); if (!edgeCandidates.length) throw new Error(`Physical edge recovery failed at edge ${index} (${start.join(",")} → ${end.join(",")}).`); const next = []; for (const state of beam) for (const edge of edgeCandidates) { const candidate = [...state.polygon]; appendUnique(candidate, edge.slice(0, -1)); next.push({ polygon: candidate, score: state.score + pathDeviation(edge, start, end) }); } beam = next.sort((a, b) => a.score - b.score).slice(0, BEAM_WIDTH); } const candidates = beam.map((state) => { const polygonCandidate = [...state.polygon]; appendUnique(polygonCandidate, [normalized[0]]); return { polygon: polygonCandidate, score: candidateScore(polygonCandidate, originalArea) }; }).filter((candidate) => candidate.polygon.length >= 3 && candidate.polygon.every(isPhysicalPoint)).sort((a, b) => a.score - b.score); const best = candidates[0]; if (!best) throw new Error("Physical polygon repair produced no valid candidate."); if (originalArea > 0 && Math.abs(signedArea(best.polygon)) / originalArea < MIN_REPAIR_AREA_RATIO) throw new Error("Physical polygon repair collapsed more than 95% of the source area."); return best.polygon; }
