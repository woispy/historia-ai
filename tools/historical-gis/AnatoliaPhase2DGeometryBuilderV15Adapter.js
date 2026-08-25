import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { PHYSICAL_LAND_POLYGONS, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint, resolvePhysicalGeometryBoundaryPoint, resolveGeometryAnchor } from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair-v2.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const PHYSICAL_BOUNDARY_FALLBACK_SAMPLES = 512;
const MAX_PHYSICAL_REPAIR_PASSES = 4;
const PARTITION_CLIP_EPS = 1e-10;

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry recovery: ${provinceId}`);
    const original = refinement.anchor;
    const resolved = resolveGeometryAnchor(provinceId, original);
    if (resolved[0] === original[0] && resolved[1] === original[1]) continue;
    originals.set(provinceId, original);
    refinement.anchor = resolved;
  }
  try {
    return callback();
  } finally {
    for (const [provinceId, original] of originals) ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original;
  }
}

function isStrictlyPhysicalPath(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) && !isFinalPhysicalGeometryBoundaryPoint(start)) return false;
    if (!isPhysicalLandPoint(end) && !isFinalPhysicalGeometryBoundaryPoint(end)) return false;
    for (let sampleIndex = 1; sampleIndex < STRICT_PHYSICAL_EDGE_SAMPLE_COUNT; sampleIndex += 1) {
      const fraction = sampleIndex / STRICT_PHYSICAL_EDGE_SAMPLE_COUNT;
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function physicalFailureDetail(polygon) {
  if (!Array.isArray(polygon)) return "polygon-unavailable";
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    for (let sampleIndex = 0; sampleIndex <= 128; sampleIndex += 1) {
      const fraction = sampleIndex / 128;
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if ((!isPhysicalLandPoint(start) && !isFinalPhysicalGeometryBoundaryPoint(start))
        || (!isPhysicalLandPoint(end) && !isFinalPhysicalGeometryBoundaryPoint(end))
        || (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point))) {
        return `edge=${index}; fraction=${fraction.toFixed(6)}; point=${point.map((value) => Number(value.toFixed(10))).join(",")}; start=${start.join(",")}; end=${end.join(",")}`;
      }
    }
  }
  return "no-failing-sample-found";
}

function isStrictlyPhysicalOpenPath(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    if ((!isPhysicalLandPoint(start) && !isFinalPhysicalGeometryBoundaryPoint(start))
      || (!isPhysicalLandPoint(end) && !isFinalPhysicalGeometryBoundaryPoint(end))) return false;
    const segments = Math.max(16, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 0.005));
    for (let sampleIndex = 1; sampleIndex < segments; sampleIndex += 1) {
      const fraction = sampleIndex / segments;
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function edgeCross(start, end, point) {
  return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]);
}

function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const before = polygon[previous];
    const cross = edgeCross(before, current, point);
    if (Math.abs(cross) <= PARTITION_CLIP_EPS
      && point[0] >= Math.min(before[0], current[0]) - PARTITION_CLIP_EPS
      && point[0] <= Math.max(before[0], current[0]) + PARTITION_CLIP_EPS
      && point[1] >= Math.min(before[1], current[1]) - PARTITION_CLIP_EPS
      && point[1] <= Math.max(before[1], current[1]) + PARTITION_CLIP_EPS) return true;
    if ((current[1] > point[1]) !== (before[1] > point[1])
      && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || Number.EPSILON) + current[0]) inside = !inside;
  }
  return inside;
}

function polygonInsideCell(polygon, cell) {
  return !cell || polygon.every((point) => pointInPolygon(point, cell));
}

function dedupePolygon(polygon) {
  const result = [];
  for (const point of polygon) {
    const previous = result[result.length - 1];
    if (!previous || Math.hypot(previous[0] - point[0], previous[1] - point[1]) > PARTITION_CLIP_EPS) result.push([...point]);
  }
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= PARTITION_CLIP_EPS) result.pop();
  }
  return result;
}

function polygonSignature(polygon) {
  return JSON.stringify(polygon.map(([longitude, latitude]) => [Number(longitude.toFixed(10)), Number(latitude.toFixed(10))]));
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

function clipConvexPolygon(polygon, cell) {
  if (!cell) return polygon;
  let output = dedupePolygon(polygon);
  const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edgeIndex = 0; edgeIndex < clip.length; edgeIndex += 1) {
    if (output.length < 3) return [];
    const start = clip[edgeIndex];
    const end = clip[(edgeIndex + 1) % clip.length];
    const input = output;
    output = [];
    const inside = (point) => edgeCross(start, end, point) >= -PARTITION_CLIP_EPS;
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index];
      const next = input[(index + 1) % input.length];
      const currentInside = inside(current);
      const nextInside = inside(next);
      if (currentInside && nextInside) output.push(next);
      else if (currentInside !== nextInside) {
        const currentValue = edgeCross(start, end, current);
        const nextValue = edgeCross(start, end, next);
        const denominator = currentValue - nextValue;
        const fraction = Math.abs(denominator) <= PARTITION_CLIP_EPS ? 0 : currentValue / denominator;
        output.push([current[0] + (next[0] - current[0]) * fraction, current[1] + (next[1] - current[1]) * fraction]);
        if (!currentInside && nextInside) output.push(next);
      }
    }
  }
  return dedupePolygon(output);
}

function sampledPhysicalBoundaryFallback(polygon) {
  const result = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    for (let sampleIndex = 0; sampleIndex < PHYSICAL_BOUNDARY_FALLBACK_SAMPLES; sampleIndex += 1) {
      if (index > 0 && sampleIndex === 0) continue;
      const fraction = sampleIndex / PHYSICAL_BOUNDARY_FALLBACK_SAMPLES;
      const original = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      const resolved = isPhysicalLandPoint(original) || isFinalPhysicalGeometryBoundaryPoint(original)
        ? original
        : resolvePhysicalGeometryBoundaryPoint(original);
      if (!resolved || (!isPhysicalLandPoint(resolved) && !isFinalPhysicalGeometryBoundaryPoint(resolved))) return null;
      const previous = result[result.length - 1];
      if (!previous || Math.hypot(previous[0] - resolved[0], previous[1] - resolved[1]) > PARTITION_CLIP_EPS) result.push([...resolved]);
    }
  }
  return result.length >= 3 && isStrictlyPhysicalOpenPath([...result, result[0]]) ? dedupePolygon(result) : null;
}

function repairPhysicalPolygonToFixedPoint(polygon, provinceId, containmentPolygon) {
  if (isStrictlyPhysicalPath(polygon) && polygonInsideCell(polygon, containmentPolygon)) return polygon;
  let current = dedupePolygon(polygon);
  let lastError = null;
  let previousSignature = null;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    const currentSignature = polygonSignature(current);
    if (currentSignature === previousSignature) break;
    previousSignature = currentSignature;
    try {
      const repaired = pass === 1 || !containmentPolygon ? repairPhysicalPolygon(current) : repairPhysicalPolygon(current, { containmentPolygon });
      const normalized = dedupePolygon(repaired);
      if (normalized.length < 3) throw new Error("physical repair returned fewer than three distinct vertices");
      if (isStrictlyPhysicalPath(normalized) && polygonInsideCell(normalized, containmentPolygon)) return normalized;
      if (containmentPolygon && isStrictlyPhysicalPath(normalized)) {
        const clipped = clipConvexPolygon(normalized, containmentPolygon);
        if (clipped.length >= 3 && isStrictlyPhysicalPath(clipped) && polygonInsideCell(clipped, containmentPolygon)) return clipped;
        current = clipped.length >= 3 ? clipped : normalized;
        continue;
      }
      current = normalized;
    } catch (error) {
      lastError = error;
      const sampled = sampledPhysicalBoundaryFallback(current);
      if (sampled) {
        if (isStrictlyPhysicalPath(sampled) && polygonInsideCell(sampled, containmentPolygon)) return sampled;
        if (containmentPolygon) {
          const clipped = clipConvexPolygon(sampled, containmentPolygon);
          if (clipped.length >= 3 && isStrictlyPhysicalPath(clipped) && polygonInsideCell(clipped, containmentPolygon)) return clipped;
          if (clipped.length >= 3) current = clipped;
        } else {
          current = sampled;
        }
      }
      if (!containmentPolygon) break;
      try {
        const unconstrained = dedupePolygon(repairPhysicalPolygon(current));
        const clipped = clipConvexPolygon(unconstrained, containmentPolygon);
        if (clipped.length >= 3 && isStrictlyPhysicalPath(clipped) && polygonInsideCell(clipped, containmentPolygon)) return clipped;
        if (clipped.length >= 3) current = clipped;
      } catch (fallbackError) {
        lastError = fallbackError;
        break;
      }
    }
  }
  const detail = Array.isArray(current) ? polygonSignature(current) : "unavailable";
  throw new Error(`Phase 2D physical repair failed for ${provinceId}: ${lastError?.message ?? "did not converge"}; physicalFailure=${physicalFailureDetail(current)}; polygon=${detail}`);
}

function normalizeGeometryContract(assets) {
  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({ ...province, header: { ...province.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" } })),
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0];
      const holes = geometry.holes ?? [];
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
      const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
      if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
      const sourcePartitionCell = geometry.sourcePartitionCell;
      const repairedPolygon = repairPhysicalPolygonToFixedPoint(polygon, provinceId ?? "unknown", sourcePartitionCell);
      return { ...geometry, sourcePartitionCell: undefined, header: { ...geometry.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" }, identity: { ...(geometry.identity ?? {}), id: provinceId, provinceId, historicalAnchor: [historicalAnchor[0], historicalAnchor[1]] }, polygons: [repairedPolygon], geometry: { ...(geometry.geometry ?? {}), type: "Polygon", coordinates: [repairedPolygon, ...holes] } };
    }),
  };
}

export function buildAnatoliaPhase2DAssets(regions) { return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions))); }

function isPhysicalGeometryBoundaryPoint(point) { return isPhysicalGeometrySupportPoint(point); }

export { isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, isFinalPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint, PHYSICAL_LAND_POLYGONS, resolveGeometryAnchor };