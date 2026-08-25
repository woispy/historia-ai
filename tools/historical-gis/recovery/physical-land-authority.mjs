import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const EPS = 1e-9;
const MIN_AREA = 0.00005;
const MAX_RECOVERY_DISTANCE = 0.75;
const RECOVERY_STEP = 0.001;

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

export const PHYSICAL_LAND_POLYGONS = Object.freeze([
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
].filter((polygon) => polygon?.length >= 3 && Math.abs(signedArea(polygon)) >= MIN_AREA));

export function isPhysicalLandPoint(point) {
  return PHYSICAL_LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon))
    && !ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function nearestBoundaryLandPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of PHYSICAL_LAND_POLYGONS) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
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
  }
  return { point: best, distance: bestDistance };
}

/**
 * Resolve a historical anchor only for temporary geometry generation.
 * Historical source anchors remain immutable. The returned point is always
 * validated against the same physical-land authority used by V15.
 */
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
  if (boundary.point && boundary.distance <= MAX_RECOVERY_DISTANCE) {
    const candidate = boundary.point;
    if (isPhysicalLandPoint(candidate)) return [...candidate];
  }

  throw new Error(`No authoritative physical-land geometry anchor candidate for ${provinceId} from ${sourceAnchor.join(",")}`);
}

export { nearestBoundaryLandPoint };
