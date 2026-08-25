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
      const repairedPolygon = repairPhysicalPolygon(polygon);
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
