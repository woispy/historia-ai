import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import {
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  resolveGeometryAnchor,
} from "./recovery/physical-land-authority.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
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
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0];
      const holes = geometry.holes ?? [];
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      return {
        ...geometry,
        geometry: geometry.geometry ?? {
          type: "Polygon",
          coordinates: [polygon, ...holes],
        },
      };
    }),
  };
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions)));
}

export {
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  PHYSICAL_LAND_POLYGONS,
  resolveGeometryAnchor,
};
