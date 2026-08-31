import { buildAnatoliaPhase2DAssets as buildPhase2D } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { isAnatoliaGeometryPoint } from "./AnatoliaGeometryAuthority.js";
import { resolveGeometryAnchor } from "./recovery/physical-land-authority.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const EXPLICIT_RECOVERY_ANCHORS = Object.freeze({
  "bithynia-nicaea": [29.69, 40.44],
});

function clonePoint(point) {
  return Array.isArray(point) ? [point[0], point[1]] : point;
}

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function resolveRecoveryAnchor(provinceId, original) {
  const explicit = EXPLICIT_RECOVERY_ANCHORS[provinceId];
  if (explicit && isAnatoliaGeometryPoint(explicit)) return clonePoint(explicit);
  const resolved = resolveGeometryAnchor(provinceId, original);
  if (!resolved || !isAnatoliaGeometryPoint(resolved)) return null;
  return clonePoint(resolved);
}

function withRecoveredAnchors(callback) {
  const originals = new Map();
  try {
    for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
      if (!refinement?.anchor) continue;
      const original = refinement.anchor;
      const resolved = resolveRecoveryAnchor(provinceId, original);
      if (!resolved || distanceSquared(resolved, original) <= Number.EPSILON) continue;
      originals.set(provinceId, clonePoint(original));
      refinement.anchor = resolved;
    }
    return callback();
  } finally {
    for (const [provinceId, original] of originals) {
      ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original;
    }
  }
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  try {
    return buildPhase2D(sourceRegions);
  } catch (error) {
    if (!(error instanceof Error) || !/Phase 2D/.test(error.message)) throw error;
    return withRecoveredAnchors(() => buildPhase2D(sourceRegions));
  }
}

export { isAnatoliaGeometryPoint };
