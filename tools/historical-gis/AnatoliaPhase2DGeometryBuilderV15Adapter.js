import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import {
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint,
  resolvePhysicalGeometryBoundaryPoint,
  resolveGeometryAnchor,
} from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const MAX_PHYSICAL_REPAIR_PASSES = 3;

/**
 * Phase 2D V16 contract adapter over the retained V15 geometry engine.
 * Historical anchors remain immutable research data. Geometry recovery is
 * temporary and uses the single shared physical-land recovery contract.
 */
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
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function repairPhysicalPolygonToFixedPoint(polygon, provinceId) {
  let current = polygon;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    const repaired = repairPhysicalPolygon(current);
    if (isStrictlyPhysicalPath(repaired)) return repaired;
    current = repaired;
  }
  throw new Error(`Phase 2D physical repair did not converge to a land-safe polygon after ${MAX_PHYSICAL_REPAIR_PASSES} passes: ${provinceId}`);
}

function normalizeGeometryContract(assets) {
  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({
      ...province,
      header: {
        ...province.header,
        assetVersion: 16,
        generator: "Historia AI Phase 2D Geometry Builder V16",
      },
    })),
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0];
      const holes = geometry.holes ?? [];
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
      const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
      if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
      const repairedPolygon = repairPhysicalPolygonToFixedPoint(polygon, provinceId ?? "unknown");
      return {
        ...geometry,
        header: {
          ...geometry.header,
          assetVersion: 16,
          generator: "Historia AI Phase 2D Geometry Builder V16",
        },
        identity: {
          ...(geometry.identity ?? {}),
          id: provinceId,
          provinceId,
          historicalAnchor: [historicalAnchor[0], historicalAnchor[1]],
        },
        polygons: [repairedPolygon],
        geometry: {
          ...(geometry.geometry ?? {}),
          type: "Polygon",
          coordinates: [repairedPolygon, ...holes],
        },
      };
    }),
  };
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions)));
}

/**
 * V15 needs the temporary support surface while constructing its intermediate
 * partition. V16 exposes the final contract separately: lake-interior support
 * points are never valid final political-edge points.
 */
function isPhysicalGeometryBoundaryPoint(point) {
  return isPhysicalGeometrySupportPoint(point);
}

export {
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
  PHYSICAL_LAND_POLYGONS,
  resolveGeometryAnchor,
};

// V16 contract marker: the adapter, not the retained V15 engine, owns the public generator identity.