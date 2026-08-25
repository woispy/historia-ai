import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * The historical Nicomedia anchor is intentionally coastal, but the current
 * Natural Earth-derived mainland polygon ends slightly inland from that
 * historical city point. V15 rejects an anchor that cannot be recovered by
 * its radial land search. Keep the research anchor untouched in the source
 * data and use a deterministic geometry-only snap for the generator.
 */
const GEOMETRY_ANCHOR_OVERRIDES = Object.freeze({
  "bithynia-nicomedia": [29.92, 40.75],
});

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, point] of Object.entries(GEOMETRY_ANCHOR_OVERRIDES)) {
    const refinement = ANATOLIA_PROVINCE_REFINEMENTS[provinceId];
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry override: ${provinceId}`);
    originals.set(provinceId, refinement.anchor);
    refinement.anchor = [...point];
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
