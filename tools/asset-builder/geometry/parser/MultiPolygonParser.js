/**
 * ============================================================================
 * Historia AI
 * MultiPolygon Parser
 * ============================================================================
 *
 * Parses GeoJSON MultiPolygon geometries.
 */

const POINT_EPSILON = 1e-9;

export function parseMultiPolygon(
  geometry
) {
  return {
    type: "MultiPolygon",

    polygons:
      geometry.coordinates.map(
        (polygon) =>
          normalizeLinearRing(polygon[0] ?? [])
      ),
  };
}

function normalizeLinearRing(ring) {
  const points = [];

  for (const point of ring) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const normalized = [x, y];
    const previous = points[points.length - 1];
    if (previous && samePoint(previous, normalized)) continue;
    points.push(normalized);
  }

  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  let changed = true;
  while (changed && points.length >= 3) {
    changed = false;

    for (let start = 0; start < points.length; start += 1) {
      const repeated = findRepeatedPoint(points, start + 1);
      if (repeated < 0) continue;

      points.splice(start + 1, repeated - start - 1);
      removeAdjacentDuplicates(points);
      changed = true;
      break;
    }
  }

  removeAdjacentDuplicates(points);
  if (points.length < 3 || Math.abs(signedArea(points)) <= 1e-12) return [];

  points.push([...points[0]]);
  return points;
}

function findRepeatedPoint(points, start) {
  for (let index = start; index < points.length; index += 1) {
    if (samePoint(points[start - 1], points[index])) return index;
  }

  return -1;
}

function removeAdjacentDuplicates(points) {
  for (let index = points.length - 1; index > 0; index -= 1) {
    if (samePoint(points[index - 1], points[index])) points.splice(index, 1);
  }
}

function signedArea(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }

  return area * 0.5;
}

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) <= POINT_EPSILON &&
    Math.abs(a[1] - b[1]) <= POINT_EPSILON;
}
