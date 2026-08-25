import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

/**
 * Phase 2D V15 compatibility adapter.
 *
 * Historical anchors remain authoritative research data. The geometry adapter
 * only supplies a deterministic, physical-land-safe working anchor when the
 * source point falls outside the current Natural Earth-derived mainland
 * polygon. Coastal recovery is derived from the physical atlas rather than
 * from a hand-written historical-coordinate replacement.
 */
const GEOMETRY_ANCHOR_SEARCH = Object.freeze({
  "bithynia-nicomedia": Object.freeze({
    maxRadius: 0.35,
    step: 0.005,
    directions: 72,
  }),
});

const EPS = 1e-9;

function polygonCentroid(polygon) {
  const total = polygon.reduce(
    (sum, [longitude, latitude]) => [sum[0] + longitude, sum[1] + latitude],
    [0, 0],
  );
  return [total[0] / polygon.length, total[1] / polygon.length];
}

function nearestBoundaryCandidate(sourceAnchor) {
  let best = null;
  let bestDistance = Infinity;

  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    if (!polygon?.length) continue;
    const centroid = polygonCentroid(polygon);
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared < EPS
        ? 0
        : Math.max(
          0,
          Math.min(
            1,
            ((sourceAnchor[0] - start[0]) * dx + (sourceAnchor[1] - start[1]) * dy) / lengthSquared,
          ),
        );
      const point = [start[0] + dx * t, start[1] + dy * t];
      const distance = Math.hypot(sourceAnchor[0] - point[0], sourceAnchor[1] - point[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { point, start, end, centroid };
      }
    }
  }

  return best;
}

function recoverFromBoundary(sourceAnchor) {
  const boundary = nearestBoundaryCandidate(sourceAnchor);
  if (!boundary) return null;

  const { point, start, end, centroid } = boundary;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  const directions = [];
  if (length > EPS) {
    directions.push([-dy / length, dx / length], [dy / length, -dx / length]);
  }

  const towardCentroid = [centroid[0] - point[0], centroid[1] - point[1]];
  const centroidLength = Math.hypot(towardCentroid[0], towardCentroid[1]);
  if (centroidLength > EPS) directions.push([towardCentroid[0] / centroidLength, towardCentroid[1] / centroidLength]);

  for (let distance = 0.001; distance <= 0.25 + EPS; distance += 0.001) {
    for (const [x, y] of directions) {
      const candidate = [point[0] + x * distance, point[1] + y * distance];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }

  return null;
}

function resolveGeometryAnchor(provinceId, sourceAnchor) {
  const search = GEOMETRY_ANCHOR_SEARCH[provinceId];
  if (!search) return [...sourceAnchor];
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

  const boundaryRecovery = recoverFromBoundary(sourceAnchor);
  if (boundaryRecovery) return boundaryRecovery;

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