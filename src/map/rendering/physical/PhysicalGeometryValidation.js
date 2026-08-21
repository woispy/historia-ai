/**
 * Historia AI — physical geometry validation.
 *
 * This module is intentionally render-independent. It provides the single
 * geometry contract used by city placement and physical-map regression tests:
 * cities must land on physical land and must not sit inside the interior of a
 * lake. A small shoreline tolerance is allowed because the current gameplay
 * lake polygons are lightweight WGS84 geometry rather than parcel-level GIS.
 */

const EPSILON = 1e-9;
const SHORELINE_TOLERANCE_DEGREES = 0.06;

function isPoint(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]));
}

function isPolygon(polygon) {
  return Array.isArray(polygon)
    && polygon.length >= 3
    && polygon.every(isPoint);
}

export function pointOnSegment(point, start, end, epsilon = EPSILON) {
  if (!isPoint(point) || !isPoint(start) || !isPoint(end)) return false;

  const px = Number(point[0]);
  const py = Number(point[1]);
  const ax = Number(start[0]);
  const ay = Number(start[1]);
  const bx = Number(end[0]);
  const by = Number(end[1]);
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > epsilon) return false;

  return px >= Math.min(ax, bx) - epsilon
    && px <= Math.max(ax, bx) + epsilon
    && py >= Math.min(ay, by) - epsilon
    && py <= Math.max(ay, by) + epsilon;
}

export function pointInPolygon(point, polygon) {
  if (!isPoint(point) || !isPolygon(polygon)) return false;

  let inside = false;
  const px = Number(point[0]);
  const py = Number(point[1]);

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];

    if (pointOnSegment(point, prior, current)) return true;

    const intersects = ((Number(current[1]) > py) !== (Number(prior[1]) > py))
      && (px < ((Number(prior[0]) - Number(current[0])) * (py - Number(current[1])))
        / (Number(prior[1]) - Number(current[1])) + Number(current[0]));

    if (intersects) inside = !inside;
  }

  return inside;
}

export function pointInAnyPolygon(point, polygons = []) {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

function distancePointToSegment(point, start, end) {
  const px = Number(point[0]);
  const py = Number(point[1]);
  const ax = Number(start[0]);
  const ay = Number(start[1]);
  const bx = Number(end[0]);
  const by = Number(end[1]);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared <= EPSILON) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distanceToPolygonBoundary(point, polygon) {
  if (!isPoint(point) || !isPolygon(polygon)) return Number.POSITIVE_INFINITY;

  let distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = (index + 1) % polygon.length;
    distance = Math.min(
      distance,
      distancePointToSegment(point, polygon[index], polygon[next]),
    );
  }
  return distance;
}

export function isPointInLakeInterior(point, lakes = [], shorelineTolerance = SHORELINE_TOLERANCE_DEGREES) {
  return lakes.some((lake) => {
    const polygon = lake?.coordinates;
    if (!pointInPolygon(point, polygon)) return false;
    return distanceToPolygonBoundary(point, polygon) > shorelineTolerance;
  });
}

export function validateCityPhysicalPosition(
  city,
  landPolygons = [],
  lakes = [],
  shorelineTolerance = SHORELINE_TOLERANCE_DEGREES,
) {
  const point = [Number(city?.x), Number(city?.y)];
  const onLand = pointInAnyPolygon(point, landPolygons);
  const inLakeInterior = isPointInLakeInterior(point, lakes, shorelineTolerance);

  return {
    valid: onLand && !inLakeInterior,
    onLand,
    inLakeInterior,
  };
}

export const PHYSICAL_GEOMETRY_RULES = Object.freeze({
  shorelineToleranceDegrees: SHORELINE_TOLERANCE_DEGREES,
});
