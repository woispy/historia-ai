import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  isPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15Adapter.js";
import { isAnatoliaGeometryPoint } from "./AnatoliaGeometryAuthority.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_STRATEGIC_PASSES, ANATOLIA_RIVER_CROSSINGS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const HISTORICAL_DATE = "1300-01-01";
const BOUNDARY_SAMPLE_STEP = 0.06;
const MAX_BOUNDARY_NUMERICAL_DRIFT = 0.0001;
const DETERMINISTIC_WEIGHT_ITERATIONS = 24;
const GEOMETRY_EPS = 1e-8;
const MIN_PROVINCE_AREA = 0.00005;
const PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const PHYSICAL_EDGE_BINARY_ITERATIONS = 16;
const SEGMENT_INTERSECTION_EPS = 1e-10;

function boundarySiteCount(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 2) return 0;
  let count = 0;
  for (let index = 0; index < polygon.length - 1; index += 1) {
    const start = polygon[index];
    const end = polygon[index + 1];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const steps = Math.max(1, Math.ceil(length / BOUNDARY_SAMPLE_STEP));
    count += steps + 1;
  }
  return count;
}

function expectedV16SiteCount() {
  const physicalLand = ANATOLIA_PHYSICAL_ATLAS.landPolygons.reduce((total, polygon) => total + boundarySiteCount(polygon), 0);
  const coastCorrections = ANATOLIA_PHYSICAL_COAST_CORRECTIONS.reduce((total, item) => total + boundarySiteCount(item.coordinates), 0);
  const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.reduce((total, lake) => total + boundarySiteCount(lake.coordinates), 0);
  return ANATOLIA_PROVINCE_METADATA.length + physicalLand + coastCorrections + lakes;
}

function physicalBoundarySiteCount() { return expectedV16SiteCount() - ANATOLIA_PROVINCE_METADATA.length; }
function naturalFeatureSiteCount() { return ANATOLIA_STRATEGIC_PASSES.length + ANATOLIA_RIVER_CROSSINGS.length; }

function pointOnSegmentProjection(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  return [start[0] + dx * t, start[1] + dy * t];
}

const PHYSICAL_LAND_BOUNDARIES = [
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
].filter((polygon) => Array.isArray(polygon) && polygon.length >= 2);

function recoverNumericalBoundaryDrift(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of PHYSICAL_LAND_BOUNDARIES) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const candidate = pointOnSegmentProjection(point, polygon[index], polygon[index + 1]);
      const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance >= bestDistance || !isPhysicalLandPoint(candidate)) continue;
      best = candidate;
      bestDistance = distance;
    }
  }
  return best && bestDistance <= MAX_BOUNDARY_NUMERICAL_DRIFT ? best : null;
}

function resolveBoundaryPoint(point) {
  if (isPhysicalLandPoint(point)) return point;
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (resolved) return resolved.map((value) => Number(value.toFixed(7)));
  if (isPhysicalGeometryBoundaryPoint(point)) {
    throw new Error(`Phase 2D geometry vertex remains a non-land support point after physical boundary resolution: ${point.join(",")}`);
  }
  const recovered = recoverNumericalBoundaryDrift(point);
  if (recovered) return recovered.map((value) => Number(value.toFixed(7)));
  throw new Error(`Phase 2D geometry vertex is outside physical land beyond numerical drift: ${point.join(",")}`);
}

function isValidPhysicalEdgePoint(point) {
  return isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
}

function physicalEdgeSample(start, end, fraction) {
  return [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
}

function segmentIntersectionFraction(start, end, boundaryStart, boundaryEnd) {
  const r = [end[0] - start[0], end[1] - start[1]];
  const s = [boundaryEnd[0] - boundaryStart[0], boundaryEnd[1] - boundaryStart[1]];
  const denominator = r[0] * s[1] - r[1] * s[0];
  const qMinusP = [boundaryStart[0] - start[0], boundaryStart[1] - start[1]];
  if (Math.abs(denominator) <= SEGMENT_INTERSECTION_EPS) return null;
  const t = (qMinusP[0] * s[1] - qMinusP[1] * s[0]) / denominator;
  const u = (qMinusP[0] * r[1] - qMinusP[1] * r[0]) / denominator;
  if (t < -SEGMENT_INTERSECTION_EPS || t > 1 + SEGMENT_INTERSECTION_EPS || u < -SEGMENT_INTERSECTION_EPS || u > 1 + SEGMENT_INTERSECTION_EPS) return null;
  return Math.max(0, Math.min(1, t));
}

function boundaryIntersections(start, end, boundaries) {
  const intersections = [];
  for (let polygonIndex = 0; polygonIndex < boundaries.length; polygonIndex += 1) {
    const polygon = boundaries[polygonIndex];
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const fraction = segmentIntersectionFraction(start, end, polygon[index], polygon[index + 1]);
      if (fraction === null) continue;
      if (intersections.every((existing) => Math.abs(existing.fraction - fraction) > SEGMENT_INTERSECTION_EPS)) {
        intersections.push({ fraction, point: physicalEdgeSample(start, end, fraction), polygon, polygonIndex, segmentIndex: index });
      }
    }
  }
  intersections.sort((left, right) => left.fraction - right.fraction);
  return intersections;
}

function lakeBoundaryCrossings(start, end) {
  const crossings = [];
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    const ring = lake.coordinates;
    if (!Array.isArray(ring) || ring.length < 3) continue;
    for (let index = 0; index < ring.length; index += 1) {
      const nextIndex = (index + 1) % ring.length;
      const fraction = segmentIntersectionFraction(start, end, ring[index], ring[nextIndex]);
      if (fraction === null) continue;
      const point = physicalEdgeSample(start, end, fraction);
      if (!isFinalPhysicalGeometryBoundaryPoint(point)) continue;
      crossings.push({ fraction, point, lake, segmentIndex: index });
    }
  }
  crossings.sort((left, right) => left.fraction - right.fraction);
  return crossings.filter((crossing, index) => index === 0 || Math.abs(crossing.fraction - crossings[index - 1].fraction) > SEGMENT_INTERSECTION_EPS);
}

function lakeBoundaryIntersections(start, end) {
  return lakeBoundaryCrossings(start, end).map(({ fraction, point }) => ({ fraction, point }));
}

function landBoundaryIntersections(start, end) {
  return boundaryIntersections(start, end, PHYSICAL_LAND_BOUNDARIES).filter(({ point }) => {
    if (isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point)) return true;
    return Boolean(recoverNumericalBoundaryDrift(point));
  });
}

function resolvePhysicalEdgeBoundary(start, end, transitionFraction) {
  const candidates = [...lakeBoundaryIntersections(start, end), ...landBoundaryIntersections(start, end)];
  const intersection = candidates.reduce((best, candidate) => {
    if (!best || Math.abs(candidate.fraction - transitionFraction) < Math.abs(best.fraction - transitionFraction)) return candidate;
    return best;
  }, null);
  if (intersection && Math.abs(intersection.fraction - transitionFraction) <= (1 / PHYSICAL_EDGE_SAMPLE_COUNT) + 1e-6) {
    const boundary = resolveBoundaryPoint(intersection.point);
    if (isValidPhysicalEdgePoint(boundary)) return boundary;
  }
  const target = physicalEdgeSample(start, end, transitionFraction);
  const resolved = resolvePhysicalGeometryBoundaryPoint(target) ?? recoverNumericalBoundaryDrift(target);
  if (!resolved) return null;
  const boundary = resolved.map((value) => Number(value.toFixed(7)));
  return isValidPhysicalEdgePoint(boundary) ? boundary : null;
}

function locatePhysicalTransition(start, end, validFraction, invalidFraction) {
  let valid = validFraction;
  let invalid = invalidFraction;
  for (let iteration = 0; iteration < PHYSICAL_EDGE_BINARY_ITERATIONS; iteration += 1) {
    const midpoint = (valid + invalid) / 2;
    if (isValidPhysicalEdgePoint(physicalEdgeSample(start, end, midpoint))) valid = midpoint;
    else invalid = midpoint;
  }
  return (valid + invalid) / 2;
}

function shorelineArc(ring, fromCrossing, toCrossing) {
  const count = ring.length;
  const fromIndex = fromCrossing.segmentIndex;
  const toIndex = toCrossing.segmentIndex;
  const fromPoint = fromCrossing.point;
  const toPoint = toCrossing.point;
  const forward = [fromPoint];
  let index = (fromIndex + 1) % count;
  let guard = 0;
  while (index !== (toIndex + 1) % count && guard <= count) {
    forward.push(ring[index]); index = (index + 1) % count; guard += 1;
  }
  forward.push(toPoint);
  const backward = [fromPoint];
  index = fromIndex; guard = 0;
  while (index !== toIndex && guard <= count) {
    backward.push(ring[index]); index = (index - 1 + count) % count; guard += 1;
  }
  backward.push(toPoint);
  const length = (path) => path.reduce((total, point, pointIndex) => pointIndex === 0 ? total : total + Math.hypot(point[0] - path[pointIndex - 1][0], point[1] - path[pointIndex - 1][1]), 0);
  return length(forward) <= length(backward) ? forward : backward;
}

function appendUniquePath(target, path) {
  for (const point of path) {
    const last = target[target.length - 1];
    if (!last || Math.hypot(last[0] - point[0], last[1] - point[1]) > GEOMETRY_EPS) target.push(point);
  }
}

function repairPhysicalEdge(start, end) {
  if (Math.hypot(end[0] - start[0], end[1] - start[1]) <= GEOMETRY_EPS) return [start, end];
  const samples = [{ fraction: 0, point: start, valid: isValidPhysicalEdgePoint(start) }];
  for (let index = 1; index < PHYSICAL_EDGE_SAMPLE_COUNT; index += 1) {
    const fraction = index / PHYSICAL_EDGE_SAMPLE_COUNT;
    const point = physicalEdgeSample(start, end, fraction);
    samples.push({ fraction, point, valid: isValidPhysicalEdgePoint(point) });
  }
  samples.push({ fraction: 1, point: end, valid: isValidPhysicalEdgePoint(end) });
  if (samples.every((sample) => sample.valid)) return [start, end];
  if (!samples[0].valid || !samples[samples.length - 1].valid) {
    throw new Error(`Phase 2D geometry edge endpoint is not on physical land: ${start.join(",")} -> ${end.join(",")}`);
  }
  const transitions = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]; const current = samples[index];
    if (previous.valid === current.valid) continue;
    transitions.push({
      fromValid: previous.valid,
      fraction: locatePhysicalTransition(start, end, previous.valid ? previous.fraction : current.fraction, previous.valid ? current.fraction : previous.fraction),
    });
  }
  const repaired = [start];
  const lakeCrossings = lakeBoundaryCrossings(start, end);
  const landCrossings = boundaryIntersections(start, end, PHYSICAL_LAND_BOUNDARIES);
  for (let index = 0; index < transitions.length; index += 1) {
    const transition = transitions[index]; const next = transitions[index + 1];
    const boundary = resolvePhysicalEdgeBoundary(start, end, transition.fraction);
    if (!boundary) throw new Error(`Phase 2D geometry edge crosses physical water without an authoritative boundary solution near fraction ${transition.fraction}: ${start.join(",")} -> ${end.join(",")}`);
    appendUniquePath(repaired, [boundary]);
    if (transition.fromValid === false || !next || next.fromValid !== false) continue;
    const findCrossing = (crossings, targetFraction) => crossings.reduce((best, crossing) => {
      if (crossing.fraction <= transition.fraction + SEGMENT_INTERSECTION_EPS || crossing.fraction >= next.fraction - SEGMENT_INTERSECTION_EPS) return best;
      if (!best || Math.abs(crossing.fraction - targetFraction) < Math.abs(best.fraction - targetFraction)) return crossing;
      return best;
    }, null);
    const lakeEntry = findCrossing(lakeCrossings, transition.fraction);
    const lakeExit = findCrossing(lakeCrossings, next.fraction);
    if (lakeEntry && lakeExit && lakeEntry.lake === lakeExit.lake) {
      appendUniquePath(repaired, shorelineArc(lakeEntry.lake.coordinates, lakeEntry, lakeExit)); continue;
    }
    const landEntry = findCrossing(landCrossings, transition.fraction);
    const landExit = findCrossing(landCrossings, next.fraction);
    if (landEntry && landExit && landEntry.polygon === landExit.polygon) appendUniquePath(repaired, shorelineArc(landEntry.polygon, landEntry, landExit));
  }
  appendUniquePath(repaired, [end]);
  for (let index = 0; index < repaired.length - 1; index += 1) {
    const segmentStart = repaired[index]; const segmentEnd = repaired[index + 1];
    for (let sampleIndex = 1; sampleIndex < 9; sampleIndex += 1) {
      const sample = physicalEdgeSample(segmentStart, segmentEnd, sampleIndex / 9);
      if (!isValidPhysicalEdgePoint(sample)) throw new Error(`Phase 2D geometry edge remains over physical water after shoreline repair: ${segmentStart.join(",")} -> ${segmentEnd.join(",")}`);
    }
  }
  return repaired;
}

function repairPolygon(polygon) {
  const repaired = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]; const end = polygon[(index + 1) % polygon.length];
    appendUniquePath(repaired, repairPhysicalEdge(start, end));
  }
  if (repaired.length > 1 && Math.hypot(repaired[0][0] - repaired[repaired.length - 1][0], repaired[0][1] - repaired[repaired.length - 1][1]) <= GEOMETRY_EPS) repaired.pop();
  return repaired;
}

export function buildAnatoliaPhase2DAssets(sourceGeometries) {
  const result = buildAnatoliaPhase2DAssetsV16(sourceGeometries);
  const geometries = result.geometries.map((geometry) => ({
    ...geometry,
    polygons: geometry.polygons.map((polygon) => {
      const area = Math.abs(polygon.reduce((sum, point, index) => {
        const next = polygon[(index + 1) % polygon.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0)) / 2;
      if (area < MIN_PROVINCE_AREA) return polygon;
      return repairPolygon(polygon);
    }),
  }));
  return { ...result, geometries };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint };
