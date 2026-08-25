import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15,
  isPhysicalLandPoint,
  nearestBoundaryLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain authoritative research data. The adapter only
 * supplies a deterministic working anchor for geometry generation. Physical
 * land is resolved by the V15 authority itself, including its coast-correction
 * polygons and lake exclusion rules; no hand-written historical replacement
 * coordinate is introduced here.
 */
const GEOMETRY_ANCHOR_SEARCH = Object.freeze({
  "bithynia-nicomedia": Object.freeze({
    maxRadius: 0.35,
    step: 0.005,
    directions: 72,
  }),
});

const EPS = 1e-9;

function localSearch(sourceAnchor, search) {
  if (isPhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];
  for (let radius = search.step; radius <= search.maxRadius + EPS; radius += search.step) {
    for (let direction = 0; direction < search.directions; direction += 1) {
      const angle = (direction / search.directions) * Math.PI * 2;
      const candidate = [
        sourceAnchor[0] + Math.cos(angle) * radius,
        sourceAnchor[1] + Math.sin(angle) * radius,
      ];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function boundarySearch(sourceAnchor) {
  const boundary = nearestBoundaryLandPoint(sourceAnchor);
  if (!boundary?.point || !Number.isFinite(boundary.distance)) return null;

  // Probe both sides of the authoritative physical boundary. This is
  // intentionally independent of political province geometry: it only asks
  // the physical atlas which side of the boundary is actual land.
  const directions = 360;
  const maxDistance = Math.min(0.35, Math.max(0.01, boundary.distance + 0.05));
  for (let radius = 0.0005; radius <= maxDistance + EPS; radius += 0.0005) {
    for (let direction = 0; direction < directions; direction += 1) {
      const angle = (direction / directions) * Math.PI * 2;
      const candidate = [
        boundary.point[0] + Math.cos(angle) * radius,
        boundary.point[1] + Math.sin(angle) * radius,
      ];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function resolveGeometryAnchor(provinceId, sourceAnchor) {
  const search = GEOMETRY_ANCHOR_SEARCH[provinceId];
  if (!search) return [...sourceAnchor];

  const local = localSearch(sourceAnchor, search);
  if (local) return local;

  const boundary = boundarySearch(sourceAnchor);
  if (boundary) return boundary;

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