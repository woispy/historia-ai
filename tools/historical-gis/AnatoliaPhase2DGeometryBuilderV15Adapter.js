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
 * source point falls just outside the current Natural Earth-derived mainland
 * polygon. Candidate points are ordered from least to most inland so the
 * geometry change stays as small as the physical atlas permits.
 */
const GEOMETRY_ANCHOR_CANDIDATES = Object.freeze({
  "bithynia-nicomedia": [
    [29.92, 40.73],
    [29.92, 40.72],
    [29.91, 40.71],
    [29.90, 40.70],
  ],
});

function resolveGeometryAnchor(provinceId, candidates) {
  const point = candidates.find((candidate) => isPhysicalLandPoint(candidate));
  if (!point) {
    throw new Error(`No physical-land geometry anchor candidate for ${provinceId}`);
  }
  return point;
}

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, candidates] of Object.entries(GEOMETRY_ANCHOR_CANDIDATES)) {
    const refinement = ANATOLIA_PROVINCE_REFINEMENTS[provinceId];
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry override: ${provinceId}`);
    originals.set(provinceId, refinement.anchor);
    refinement.anchor = [...resolveGeometryAnchor(provinceId, candidates)];
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
