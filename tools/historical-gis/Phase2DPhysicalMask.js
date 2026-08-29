import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;

export function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

export function polygonArea(polygon) { return Math.abs(signedArea(polygon)); }

export function pointOnSegment(point, a, b) {
  const cross = Math.abs((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]));
  if (cross > EPS) return false;
  return point[0] >= Math.min(a[0], b[0]) - EPS
    && point[0] <= Math.max(a[0], b[0]) + EPS
    && point[1] >= Math.min(a[1], b[1]) - EPS
    && point[1] <= Math.max(a[1], b[1]) + EPS;
}

export function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  for (let i = 0; i < polygon.length; i += 1) {
    if (pointOnSegment(point, polygon[i], polygon[(i + 1) % polygon.length])) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
    j = i;
  }
  return inside;
}

export function pointInPolygonStrict(point, polygon) {
  if (!pointInPolygon(point, polygon)) return false;
  return !polygon.some((vertex, index) => pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length]));
}

export function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator <= EPS
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / denominator));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function correctionLandPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS
    .map((correction) => correction.coordinates ?? [])
    .filter((polygon) => polygon.length >= 3 && polygonArea(polygon) >= MIN_AREA);
}

function exclusionPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS
    .flatMap((correction) => correction.exclusionCoordinates ?? [])
    .filter((polygon) => polygon.length >= 3 && polygonArea(polygon) >= MIN_AREA);
}

function explicitLandControlPoints() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => [
    ...(correction.landControlPoints ?? []),
    ...(correction.controlPoints ?? []),
  ]);
}

export function isPhysicalLandPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  if (exclusionPolygons().some((polygon) => pointInPolygonStrict(point, polygon))) return false;
  if (explicitLandControlPoints().some((control) => point[0] === control[0] && point[1] === control[1])) return true;
  if (ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygonStrict(point, lake.coordinates))) return false;
  if (correctionLandPolygons().some((polygon) => pointInPolygon(point, polygon))) return true;
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return true;
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => polygon.some((a, index) => (
    distanceToSegment(point, a, polygon[(index + 1) % polygon.length]) <= COAST_TOLERANCE
  )));
}

export function getPhysicalLandPolygons() {
  return [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...correctionLandPolygons()];
}

export function getPhysicalWaterPolygons() {
  return [
    ...ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.map((lake) => lake.coordinates),
    ...exclusionPolygons(),
  ].filter((polygon) => polygon.length >= 3 && polygonArea(polygon) >= MIN_AREA);
}
