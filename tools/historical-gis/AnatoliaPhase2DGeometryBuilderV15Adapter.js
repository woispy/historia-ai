import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain research data. This adapter resolves only the
 * temporary geometry seed against the same authoritative land polygons used
 * by V15. Coast-correction overlays are intentionally excluded here because
 * V15's own physical-land validation does not treat them as authority.
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

const EPS = 1e-9;

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return sum / 2;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

const LAND_POLYGONS = ANATOLIA_PHYSICAL_ATLAS.landPolygons
  .filter((polygon) => polygon?.length >= 3 && Math.abs(signedArea(polygon)) > EPS);

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

export function isAuthoritativePhysicalLandPoint(point) {
  return LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon)) && !inLake(point);
}

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
      if (isAuthoritativePhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

export function resolveGeometryAnchor(provinceId, sourceAnchor) {
  if (isAuthoritativePhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];
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

// Keep the legacy adapter contract used by AnatoliaPhase2DGeometryBuilder.js.
export { isAuthoritativePhysicalLandPoint as isPhysicalLandPoint };
