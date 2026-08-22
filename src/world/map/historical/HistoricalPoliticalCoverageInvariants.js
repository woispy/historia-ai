/**
 * World-scale invariants for the 1300 political overlay.
 *
 * These helpers deliberately operate on polygons rather than on province
 * ownership. That keeps the physical land/coast authority independent from
 * historical political identity and lets the same checks cover the entire
 * world, not only the 38 Anatolian gameplay provinces.
 */

function pointOnSegment(point, a, b, epsilon = 1e-9) {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > epsilon) return false;
  return px >= Math.min(ax, bx) - epsilon
    && px <= Math.max(ax, bx) + epsilon
    && py >= Math.min(ay, by) - epsilon
    && py <= Math.max(ay, by) + epsilon;
}

export function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    if (pointOnSegment(point, previousPoint, currentPoint)) return true;

    const [xi, yi] = currentPoint;
    const [xj, yj] = previousPoint;
    const intersects = ((yi > point[1]) !== (yj > point[1]))
      && (point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function flattenPolygons(entries) {
  return entries.flatMap((entry) => Array.isArray(entry?.geometry?.polygons)
    ? entry.geometry.polygons
    : Array.isArray(entry?.polygons)
      ? entry.polygons
      : []);
}

function polygonCentroid(polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) return null;
  const sum = polygon.reduce((accumulator, [x, y]) => [accumulator[0] + x, accumulator[1] + y], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function polygonSamples(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return [];

  const samples = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    samples.push(current);
    samples.push([(current[0] + next[0]) / 2, (current[1] + next[1]) / 2]);
  }

  const centroid = polygonCentroid(polygon);
  if (centroid) samples.push(centroid);
  return samples;
}

function collectSamples(polygons) {
  return polygons.flatMap((polygon) => polygonSamples(polygon));
}

function isCovered(point, polygons) {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

/**
 * Audits the two hard world-map rules without requiring a GIS boolean
 * clipping dependency:
 *
 * - vertices, edge midpoints and centroids of physical-land polygons must
 *   have political coverage;
 * - vertices, edge midpoints and centroids of political polygons must remain
 *   on physical land.
 *
 * The renderer still performs the final exact sea clipping through the P0
 * world-land-mask. This audit therefore catches source-geometry gaps/leaks
 * while the renderer provides the exact final visual exclusion at the coast.
 */
export function auditHistoricalPoliticalCoverage({ landPolygons = [], politicalEntries = [] } = {}) {
  const politicalPolygons = flattenPolygons(politicalEntries);
  const landSamples = collectSamples(landPolygons);
  const politicalSamples = collectSamples(politicalPolygons);

  const uncoveredLandSamples = landSamples.filter((point) => !isCovered(point, politicalPolygons));
  const politicalSamplesOutsideLand = politicalSamples.filter((point) => !isCovered(point, landPolygons));

  return Object.freeze({
    landSampleCount: landSamples.length,
    politicalSampleCount: politicalSamples.length,
    uncoveredLandSamples,
    politicalSamplesOutsideLand,
    landCoveragePass: uncoveredLandSamples.length === 0,
    seaLeakPass: politicalSamplesOutsideLand.length === 0,
    pass: uncoveredLandSamples.length === 0 && politicalSamplesOutsideLand.length === 0,
  });
}

export function assertHistoricalPoliticalCoverage(options) {
  const audit = auditHistoricalPoliticalCoverage(options);
  if (!audit.pass) {
    throw new Error(
      `Historical political coverage invariant failed: ${audit.uncoveredLandSamples.length} uncovered land samples, `
      + `${audit.politicalSamplesOutsideLand.length} political samples outside physical land.`,
    );
  }
  return audit;
}
