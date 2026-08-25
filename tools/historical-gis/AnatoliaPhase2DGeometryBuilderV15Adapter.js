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
 * The original historical anchor is restored after generation.
 */
const GEOMETRY_ANCHOR_SEARCH = Object.freeze({
  "bithynia-nicomedia": Object.freeze({ maxDistance: 0.75, step: 0.001 }),
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

function isAuthoritativePhysicalLandPoint(point) {
  return LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon)) && !inLake(point);
}

function resolveFromLocalGrid(sourceAnchor, search) {
  const rings = Math.ceil(search.maxDistance / search.step);
  for (let ring = 1; ring <= rings; ring += 1) {
    const distance = ring * search.step;
    const samples = Math.max(96, Math.ceil((Math.PI * 2 * distance) / search.step));
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

function resolveGeometryAnchor(provinceId, sourceAnchor) {
  const search = GEOMETRY_ANCHOR_SEARCH[provinceId];
  if (!search) return [...sourceAnchor];
  const recovered = resolveFromLocalGrid(sourceAnchor, search);
  if (recovered) return recovered;
  throw new Error(`No authoritative physical-land geometry anchor candidate for ${provinceId} from ${sourceAnchor.join(",")}`);
}

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const provinceId of Object.keys(GEOMETRY_ANCHOR_SEARCH)) {
    const refinement = ANATOLIA_PROVINCE_REFINEMENTS[provinceId];
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry override: ${provinceId}`);
    const original = refinement.anchor;
    const resolved = resolveGeometryAnchor(provinceId, original);
    if (resolved[0] === original[0] && resolved[1] === original[1]) {
      throw new Error(`Geometry anchor recovery did not move off historical anchor for ${provinceId}`);
    }
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
export { isAuthoritativePhysicalLandPoint, isAuthoritativePhysicalLandPoint as isPhysicalLandPoint };
