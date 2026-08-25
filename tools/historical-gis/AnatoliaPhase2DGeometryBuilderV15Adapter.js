import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import {
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
} from "./recovery/physical-land-authority.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain research data. This adapter resolves only the
 * temporary geometry seed against the single physical-land authority shared
 * by recovery and V15. Coast corrections are part of that authority; they do
 * not form a second polygon source.
 *
 * Recovery is policy-driven rather than province-driven: every province uses
 * the same deterministic recovery contract, and recovery is only performed
 * when its historical anchor is not already valid physical land. This keeps
 * Nicomedia from becoming a permanent special case while preserving all
 * anchors that already satisfy the production geometry authority.
 */
const GEOMETRY_ANCHOR_RECOVERY_POLICY = Object.freeze({
  maxDistance: 0.75,
  step: 0.001,
});

function resolveFromLocalGrid(sourceAnchor, policy) {
  const rings = Math.ceil(policy.maxDistance / policy.step);
  for (let ring = 1; ring <= rings; ring += 1) {
    const distance = ring * policy.step;
    const samples = Math.max(96, Math.ceil((Math.PI * 2 * distance) / policy.step));
    for (let sample = 0; sample < samples; sample += 1) {
      const angle = (sample / samples) * Math.PI * 2;
      const candidate = [
        sourceAnchor[0] + Math.cos(angle) * distance,
        sourceAnchor[1] + Math.sin(angle) * distance,
      ];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

export function resolveGeometryAnchor(provinceId, sourceAnchor) {
  if (isPhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];
  const recovered = resolveFromLocalGrid(sourceAnchor, GEOMETRY_ANCHOR_RECOVERY_POLICY);
  if (recovered) return recovered;
  throw new Error(`No authoritative physical-land geometry anchor candidate for ${provinceId} from ${sourceAnchor.join(",")}`);
}

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
    for (const [provinceId, original] of originals) {
      ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original;
    }
  }
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => buildAnatoliaPhase2DAssetsV15(regions));
}

// Legacy adapter contract plus the shared physical-land polygon authority.
export { isPhysicalLandPoint };
export { PHYSICAL_LAND_POLYGONS };
