import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { PHYSICAL_LAND_POLYGONS, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint, resolvePhysicalGeometryBoundaryPoint, resolveGeometryAnchor } from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair-v2.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const MAX_PHYSICAL_REPAIR_PASSES = 4;
const PARTITION_CLIP_EPS = 1e-10;

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry recovery: ${provinceId}`);
    const original = refinement.anchor; const resolved = resolveGeometryAnchor(provinceId, original);
    if (resolved[0] === original[0] && resolved[1] === original[1]) continue;
    originals.set(provinceId, original); refinement.anchor = resolved;
  }
  try { return callback(); } finally { for (const [provinceId, original] of originals) ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original; }
}

function isStrictlyPhysicalPath(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]; const end = polygon[(index + 1) % polygon.length];
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

function edgeCross(start, end, point) { return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]); }
function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index]; const before = polygon[previous];
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
function polygonInsideCell(polygon, cell) { return !cell || polygon.every((point) => pointInPolygon(point, cell)); }
function dedupePolygon(polygon) {
  const result = [];
  for (const point of polygon) {
    const previous = result[result.length - 1];
    if (!previous || Math.hypot(previous[0] - point[0], previous[1] - point[1]) > PARTITION_CLIP_EPS) result.push([...point]);
  }
  if (result.length > 1) {
    const first = result[0]; const last = result[result.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= PARTITION_CLIP_EPS) result.pop();
  }
  return result;
}
function polygonSignature(polygon) {
  return JSON.stringify(polygon.map(([longitude, latitude]) => [Number(longitude.toFixed(10)), Number(latitude.toFixed(10))]));
}
function repairPhysicalPolygonToFixedPoint(polygon, provinceId, containmentPolygon) {
  if (isStrictlyPhysicalPath(polygon) && polygonInsideCell(polygon, containmentPolygon)) return polygon;
  let current = dedupePolygon(polygon); let lastError = null; let previousSignature = null;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    const currentSignature = polygonSignature(current);
    if (currentSignature === previousSignature) break;
    previousSignature = currentSignature;
    try {
      const repaired = pass === 1 || !containmentPolygon
        ? repairPhysicalPolygon(current)
        : repairPhysicalPolygon(current, { containmentPolygon });
      const normalized = dedupePolygon(repaired);
      if (normalized.length < 3) throw new Error("physical repair returned fewer than three distinct vertices");
      if (isStrictlyPhysicalPath(normalized) && polygonInsideCell(normalized, containmentPolygon)) return normalized;
      if (!isStrictlyPhysicalPath(normalized)) {
        current = normalized;
        continue;
      }
      if (containmentPolygon) {
        current = normalized;
        continue;
      }
      throw new Error("physical repair returned geometry outside the authoritative source partition");
    } catch (error) { lastError = error; break; }
  }
  const detail = Array.isArray(current) ? polygonSignature(current) : "unavailable";
  throw new Error(`Phase 2D physical repair failed for ${provinceId}: ${lastError?.message ?? "did not converge"}; polygon=${detail}`);
}

function normalizeGeometryContract(assets) {
  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({ ...province, header: { ...province.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" } })),
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0]; const holes = geometry.holes ?? [];
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
      const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
      if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
      const sourcePartitionCell = geometry.sourcePartitionCell;
      const repairedPolygon = repairPhysicalPolygonToFixedPoint(polygon, provinceId ?? "unknown", sourcePartitionCell);
      return {
        ...geometry,
        sourcePartitionCell: undefined,
        header: { ...geometry.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" },
        identity: { ...(geometry.identity ?? {}), id: provinceId, provinceId, historicalAnchor: [historicalAnchor[0], historicalAnchor[1]] },
        polygons: [repairedPolygon],
        geometry: { ...(geometry.geometry ?? {}), type: "Polygon", coordinates: [repairedPolygon, ...holes] },
      };
    }),
  };
}

export function buildAnatoliaPhase2DAssets(regions) { return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions))); }
function isPhysicalGeometryBoundaryPoint(point) { return isPhysicalGeometrySupportPoint(point); }
export { isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, isFinalPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint, PHYSICAL_LAND_POLYGONS, resolveGeometryAnchor };