import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain authoritative research data. The geometry adapter
 * only supplies a deterministic, physical-land-safe working anchor when the
 * source point falls outside the current Natural Earth-derived mainland
 * polygon. Candidate points are generated as concentric local rings so small
 * coastline differences do not require changing historical coordinates.
 */
const GEOMETRY_ANCHOR_SEARCH = Object.freeze({
  "bithynia-nicomedia": Object.freeze({
    maxRadius: 1.2,
    step: 0.01,
    directions: 72,
  }),
});

function resolveGeometryAnchor(provinceId, sourceAnchor) {
  const search = GEOMETRY_ANCHOR_SEARCH[provinceId];
  if (!search) return [...sourceAnchor];
  if (isPhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];

  for (let radius = search.step; radius <= search.maxRadius + 1e-9; radius += search.step) {
    for (let direction = 0; direction < search.directions; direction += 1) {
      const angle = (direction / search.directions) * Math.PI * 2;
      const candidate = [
        sourceAnchor[0] + Math.cos(angle) * radius,
        sourceAnchor[1] + Math.sin(angle) * radius,
      ];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }

  throw new Error(`No physical-land geometry anchor candidate for ${provinceId}`);
}

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const provinceId of Object.keys(GEOMETRY_ANCHOR_SEARCH)) {
    const refinement = ANATOLIA_PROVINCE_REFINEMENTS[provinceId];
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry override: ${provinceId}`);
    originals.set(provinceId, refinement.anchor);
    refinement.anchor = resolveGeometryAnchor(provinceId, refinement.anchor);
  }
  try {
    return callback();
  } finally {
    for (const [provinceId, point] of originals) ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = point;
  }
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => buildAnatoliaPhase2DAssetsV15(regions));
}

export { isPhysicalLandPoint };
