import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain research data. This adapter resolves only the
 * temporary geometry seed against the same physical atlas used by V15. It
 * deliberately does not maintain a second coastline/boundary implementation.
 */
const GEOMETRY_ANCHOR_SEARCH = Object.freeze({
  "bithynia-nicomedia": Object.freeze({ maxDistance: 0.35, step: 0.001 }),
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

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

const LAND_POLYGONS = [
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
].filter((polygon) => polygon?.length >= 3 && Math.abs(signedArea(polygon)) > EPS);

function isPhysicalLandPoint(point) {
  return LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon)) && !inLake(point);
}

function nearestBoundarySegment(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of LAND_POLYGONS) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const denominator = dx * dx + dy * dy;
      const t = denominator < EPS
        ? 0
        : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
      const boundary = [start[0] + dx * t, start[1] + dy * t];
      const distance = Math.hypot(point[0] - boundary[0], point[1] - boundary[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { start, end, point: boundary, distance };
      }
    }
  }
  return best;
}

function resolveFromBoundary(sourceAnchor, search) {
  const boundary = nearestBoundarySegment(sourceAnchor);
  if (!boundary || boundary.distance > search.maxDistance) return null;

  const dx = boundary.end[0] - boundary.start[0];
  const dy = boundary.end[1] - boundary.start[1];
  const length = Math.hypot(dx, dy) || 1;
  const normals = [[-dy / length, dx / length], [dy / length, -dx / length]];

  // Probe both normals from the authoritative boundary. This avoids guessing
  // which winding direction the source polygon uses and makes the recovery
  // robust at coastal concavities.
  for (let distance = search.step; distance <= search.maxDistance + EPS; distance += search.step) {
    for (const [nx, ny] of normals) {
      const candidate = [boundary.point[0] + nx * distance, boundary.point[1] + ny * distance];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function resolveGeometryAnchor(provinceId, sourceAnchor) {
  const search = GEOMETRY_ANCHOR_SEARCH[provinceId];
  if (!search) return [...sourceAnchor];
  if (isPhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];

  const recovered = resolveFromBoundary(sourceAnchor, search);
  if (recovered) return recovered;

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
    for (const [provinceId, point] of originals) {
      ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = point;
    }
  }
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => buildAnatoliaPhase2DAssetsV15(regions));
}

export { isPhysicalLandPoint };