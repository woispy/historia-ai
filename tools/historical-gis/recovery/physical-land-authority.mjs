import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const EPS = 1e-9;
const MIN_AREA = 0.00005;
const MAX_RECOVERY_DISTANCE = 0.75;
const RECOVERY_STEP = 0.001;
const NUMERICAL_BOUNDARY_TOLERANCE = 0.0001;
const BBOX_EPS = NUMERICAL_BOUNDARY_TOLERANCE;

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return sum / 2;
}

function bounds(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return { minX, minY, maxX, maxY };
}

function bboxContains(point, bbox, padding = BBOX_EPS) {
  return point[0] >= bbox.minX - padding
    && point[0] <= bbox.maxX + padding
    && point[1] >= bbox.minY - padding
    && point[1] <= bbox.maxY + padding;
}

function segmentBounds(start, end) {
  return {
    minX: Math.min(start[0], end[0]),
    minY: Math.min(start[1], end[1]),
    maxX: Math.max(start[0], end[0]),
    maxY: Math.max(start[1], end[1]),
  };
}

function bboxesOverlap(a, b, padding = 0) {
  return !(a.maxX + padding < b.minX
    || a.minX - padding > b.maxX
    || a.maxY + padding < b.minY
    || a.minY - padding > b.maxY);
}

export function pointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const cross = (point[0] - start[0]) * dy - (point[1] - start[1]) * dx;
  const length = Math.hypot(dx, dy);
  const crossTolerance = NUMERICAL_BOUNDARY_TOLERANCE * Math.max(1, length);
  if (Math.abs(cross) > Math.max(EPS, crossTolerance)) return false;
  return point[0] >= Math.min(start[0], end[0]) - NUMERICAL_BOUNDARY_TOLERANCE
    && point[0] <= Math.max(start[0], end[0]) + NUMERICAL_BOUNDARY_TOLERANCE
    && point[1] >= Math.min(start[1], end[1]) - NUMERICAL_BOUNDARY_TOLERANCE
    && point[1] <= Math.max(start[1], end[1]) + NUMERICAL_BOUNDARY_TOLERANCE;
}

export function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    if (pointOnSegment(point, a, b)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

export const PHYSICAL_LAND_POLYGONS = Object.freeze([
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
].filter((polygon) => polygon?.length >= 3 && Math.abs(signedArea(polygon)) >= MIN_AREA));

const LAND_POLYGON_BOUNDS = Object.freeze(
  PHYSICAL_LAND_POLYGONS.map((polygon) => ({ polygon, bbox: bounds(polygon) })),
);

function lakeRings(lake) {
  return lake.rings ?? [lake.coordinates];
}

function buildLakeBoundarySegments(lakes) {
  const result = [];
  for (const lake of lakes) {
    for (const [ringIndex, ring] of lakeRings(lake).entries()) {
      if (!Array.isArray(ring) || ring.length < 3) continue;
      for (let segmentIndex = 0; segmentIndex < ring.length; segmentIndex += 1) {
        const start = ring[segmentIndex];
        const end = ring[(segmentIndex + 1) % ring.length];
        result.push({ lake, ring, ringIndex, segmentIndex, start, end, bbox: segmentBounds(start, end) });
      }
    }
  }
  return Object.freeze(result);
}

function lakeOuterRingIsAuthoritative(lake) {
  const outerRing = lakeRings(lake)[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) return false;
  return outerRing.every((point) => LAND_POLYGON_BOUNDS.some(({ polygon, bbox }) => bboxContains(point, bbox) && pointInPolygon(point, polygon)));
}

export const AUTHORITATIVE_LAKES = Object.freeze(
  ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter(lakeOuterRingIsAuthoritative),
);

const LAKE_BOUNDARY_SEGMENTS = buildLakeBoundarySegments(AUTHORITATIVE_LAKES);

function isLakeBoundaryPoint(point) {
  return LAKE_BOUNDARY_SEGMENTS.some((segment) => bboxContains(point, segment.bbox) && pointOnSegment(point, segment.start, segment.end));
}

export function isLakeInteriorPoint(point) {
  return AUTHORITATIVE_LAKES.some((lake) => {
    const rings = lakeRings(lake);
    if (!rings.length) return false;
    const outer = bounds(rings[0]);
    if (!bboxContains(point, outer, 0)) return false;
    return pointInPolygon(point, rings[0])
      && !rings.slice(1).some((ring) => {
        const ringBox = bounds(ring);
        return bboxContains(point, ringBox, 0) && pointInPolygon(point, ring);
      });
  });
}

function nearestPointOnRing(point, ring) {
  let best = null;
  let bestDistance = Infinity;
  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const denominator = dx * dx + dy * dy;
    const t = denominator < EPS
      ? 0
      : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
    const candidate = [start[0] + dx * t, start[1] + dy * t];
    const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return { point: best, distance: bestDistance };
}

export function nearestLakeBoundaryPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const segment of LAKE_BOUNDARY_SEGMENTS) {
    if (segment.bbox.maxX < point[0] - bestDistance || segment.bbox.minX > point[0] + bestDistance
      || segment.bbox.maxY < point[1] - bestDistance || segment.bbox.minY > point[1] + bestDistance) continue;
    const candidate = nearestPointOnRing(point, [segment.start, segment.end]);
    if (candidate.distance < bestDistance) {
      best = candidate.point;
      bestDistance = candidate.distance;
    }
  }
  return { point: best, distance: bestDistance };
}

function nearestBoundaryLandPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const { polygon, bbox } of LAND_POLYGON_BOUNDS) {
    const dx = point[0] < bbox.minX ? bbox.minX - point[0] : point[0] > bbox.maxX ? point[0] - bbox.maxX : 0;
    const dy = point[1] < bbox.minY ? bbox.minY - point[1] : point[1] > bbox.maxY ? point[1] - bbox.maxY : 0;
    if (Math.hypot(dx, dy) > bestDistance) continue;
    const candidate = nearestPointOnRing(point, polygon);
    if (candidate.distance < bestDistance) {
      best = candidate.point;
      bestDistance = candidate.distance;
    }
  }
  return { point: best, distance: bestDistance };
}

export function isPhysicalLandPoint(point) {
  for (const { polygon, bbox } of LAND_POLYGON_BOUNDS) {
    if (!bboxContains(point, bbox, NUMERICAL_BOUNDARY_TOLERANCE)) continue;
    if (pointInPolygon(point, polygon)) {
      if (isLakeBoundaryPoint(point)) return true;
      if (!isLakeInteriorPoint(point)) return true;
    }
  }
  const boundary = nearestBoundaryLandPoint(point);
  return Boolean(boundary.point)
    && boundary.distance <= NUMERICAL_BOUNDARY_TOLERANCE
    && !isLakeInteriorPoint(point);
}

function isWaterSideOfLakeBoundary(point, shoreline) {
  if (!shoreline?.point || !Number.isFinite(shoreline.distance) || shoreline.distance <= EPS) return false;
  const scale = Math.min(0.0005, shoreline.distance * 0.5);
  const ratio = scale / shoreline.distance;
  const probe = [
    shoreline.point[0] + (point[0] - shoreline.point[0]) * ratio,
    shoreline.point[1] + (point[1] - shoreline.point[1]) * ratio,
  ];
  return !isPhysicalLandPoint(probe);
}

function isLakeShorelineRecoveryCandidate(point, shoreline) {
  if (!shoreline?.point || shoreline.distance > MAX_RECOVERY_DISTANCE) return false;
  if (isLakeInteriorPoint(point)) return true;
  if (isLakeBoundaryPoint(point)) return true;
  return isWaterSideOfLakeBoundary(point, shoreline);
}

export function resolvePhysicalGeometryBoundaryPoint(point) {
  if (isPhysicalLandPoint(point)) return [...point];

  const shoreline = nearestLakeBoundaryPoint(point);
  const landBoundary = nearestBoundaryLandPoint(point);

  if (isLakeInteriorPoint(point)
    && shoreline.point
    && shoreline.distance <= MAX_RECOVERY_DISTANCE) {
    return [...shoreline.point];
  }

  if (!isLakeInteriorPoint(point)
    && landBoundary.point
    && landBoundary.distance <= MAX_RECOVERY_DISTANCE) {
    return [...landBoundary.point];
  }

  if (isLakeShorelineRecoveryCandidate(point, shoreline)
    && shoreline.distance <= MAX_RECOVERY_DISTANCE
    && (isLakeBoundaryPoint(point) || shoreline.distance <= landBoundary.distance)) {
    return [...shoreline.point];
  }
  return null;
}

export function isPhysicalGeometryBoundaryPoint(point) {
  return isPhysicalLandPoint(point) || isLakeInteriorPoint(point);
}

export function isFinalPhysicalGeometryBoundaryPoint(point) {
  return isPhysicalLandPoint(point) || isLakeBoundaryPoint(point);
}

export function resolveGeometryAnchor(provinceId, sourceAnchor) {
  if (isPhysicalLandPoint(sourceAnchor)) return [...sourceAnchor];
  for (let distance = RECOVERY_STEP; distance <= MAX_RECOVERY_DISTANCE + EPS; distance += RECOVERY_STEP) {
    const samples = Math.max(96, Math.ceil((Math.PI * 2 * distance) / RECOVERY_STEP));
    for (let sample = 0; sample < samples; sample += 1) {
      const angle = (sample / samples) * Math.PI * 2;
      const candidate = [
        sourceAnchor[0] + Math.cos(angle) * distance,
        sourceAnchor[1] + Math.sin(angle) * distance,
      ];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  const boundary = nearestBoundaryLandPoint(sourceAnchor);
  if (boundary.point && boundary.distance <= MAX_RECOVERY_DISTANCE && isPhysicalLandPoint(boundary.point)) return [...boundary.point];
  throw new Error(`No authoritative physical-land geometry anchor candidate for ${provinceId} from ${sourceAnchor.join(",")}`);
}

export { nearestBoundaryLandPoint };