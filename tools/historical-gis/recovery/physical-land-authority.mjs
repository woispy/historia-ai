import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const EPS = 1e-9;
const MIN_AREA = 0.00005;
const MAX_RECOVERY_DISTANCE = 0.75;
const RECOVERY_STEP = 0.001;
const NUMERICAL_BOUNDARY_TOLERANCE = 0.0001;

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return sum / 2;
}

export function pointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const cross = (point[0] - start[0]) * dy - (point[1] - start[1]) * dx;
  if (Math.abs(cross) > EPS) return false;
  return point[0] >= Math.min(start[0], end[0]) - EPS
    && point[0] <= Math.max(start[0], end[0]) + EPS
    && point[1] >= Math.min(start[1], end[1]) - EPS
    && point[1] <= Math.max(start[1], end[1]) + EPS;
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

function lakeRings(lake) {
  return lake.rings ?? [lake.coordinates];
}

function isLakeBoundaryPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => lakeRings(lake).some((ring) => ring?.some((vertex, index) => pointOnSegment(point, vertex, ring[(index + 1) % ring.length]))));
}

export function isLakeInteriorPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => {
    const rings = lakeRings(lake);
    return rings.length > 0 && pointInPolygon(point, rings[0])
      && !rings.slice(1).some((ring) => pointInPolygon(point, ring));
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
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    for (const ring of lakeRings(lake)) {
      if (!ring?.length) continue;
      const candidate = nearestPointOnRing(point, ring);
      if (candidate.distance < bestDistance) {
        best = candidate.point;
        bestDistance = candidate.distance;
      }
    }
  }
  return { point: best, distance: bestDistance };
}

function nearestBoundaryLandPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of PHYSICAL_LAND_POLYGONS) {
    const candidate = nearestPointOnRing(point, polygon);
    if (candidate.distance < bestDistance) {
      best = candidate.point;
      bestDistance = candidate.distance;
    }
  }
  return { point: best, distance: bestDistance };
}

/**
 * Closed physical-land membership used by geometry construction. Coastline
 * and lake boundary points belong to the shared boundary of the physical
 * surface; only the strict lake interior is excluded. A small numerical
 * closure tolerance is allowed when clipping/intersection arithmetic places
 * a vertex infinitesimally outside an authoritative coastline.
 */
export function isPhysicalLandPoint(point) {
  if (PHYSICAL_LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon))) {
    if (isLakeBoundaryPoint(point)) return true;
    if (!isLakeInteriorPoint(point)) return true;
  }
  const boundary = nearestBoundaryLandPoint(point);
  return Boolean(boundary.point)
    && boundary.distance <= NUMERICAL_BOUNDARY_TOLERANCE
    && !isLakeInteriorPoint(point);
}

/**
 * Resolve a geometry vertex to the closed physical surface. Lake-interior
 * vertices are snapped to the authoritative lake shoreline rather than being
 * accepted as land. This preserves explicit lake holes without allowing a
 * political polygon's outer ring to carry an inland-water vertex.
 */
export function resolvePhysicalGeometryBoundaryPoint(point) {
  if (isPhysicalLandPoint(point)) return [...point];
  if (isLakeInteriorPoint(point)) {
    const shoreline = nearestLakeBoundaryPoint(point);
    if (shoreline.point) return [...shoreline.point];
  }
  const boundary = nearestBoundaryLandPoint(point);
  if (boundary.point && boundary.distance <= NUMERICAL_BOUNDARY_TOLERANCE && !isLakeInteriorPoint(point)) {
    return [...boundary.point];
  }
  return null;
}

/**
 * Province construction may temporarily carry an explicit lake footprint in
 * its outer support cell. The final province asset removes that footprint as
 * a lake hole. Sea/outside points are never accepted here.
 */
export function isPhysicalGeometryBoundaryPoint(point) {
  return isPhysicalLandPoint(point) || isLakeInteriorPoint(point);
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
