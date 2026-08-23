/**
 * World-scale invariants for the 1300 political overlay.
 *
 * These helpers deliberately operate on polygons rather than on province
 * ownership. That keeps the physical land/coast authority independent from
 * historical political identity and lets the same checks cover the entire
 * world, not only the 38 Anatolian gameplay provinces.
 */

import { HISTORICAL_POLITICAL_COVERAGE_CONTRACT } from "./HistoricalPoliticalCoverageContract.js";

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
 * Audits source geometry and the explicit renderer contract.
 *
 * Historical 1300 source data does not assign a historical polity to every
 * modern landmass, so the renderer supplies a neutral land presentation
 * underneath the political polygons. Source political polygons may also
 * extend beyond the physical coast; the world-land clip is the authoritative
 * sea exclusion at render time. Those presentation guarantees are accepted
 * only through the named global contract, never through per-call booleans.
 */
export function auditHistoricalPoliticalCoverage({
  landPolygons = [],
  politicalEntries = [],
  presentationContract = HISTORICAL_POLITICAL_COVERAGE_CONTRACT,
} = {}) {
  const politicalPolygons = flattenPolygons(politicalEntries);
  const landSamples = collectSamples(landPolygons);
  const politicalSamples = collectSamples(politicalPolygons);

  const uncoveredLandSamples = landSamples.filter((point) => !isCovered(point, politicalPolygons));
  const politicalSamplesOutsideLand = politicalSamples.filter((point) => !isCovered(point, landPolygons));
  const sourceLandCoveragePass = uncoveredLandSamples.length === 0;
  const sourceSeaLeakPass = politicalSamplesOutsideLand.length === 0;
  const landCoveragePass = sourceLandCoveragePass || presentationContract.neutralLandFallback === true;
  const seaLeakPass = sourceSeaLeakPass || presentationContract.landClip === "world-land-mask";

  return Object.freeze({
    landSampleCount: landSamples.length,
    politicalSampleCount: politicalSamples.length,
    uncoveredLandSamples,
    politicalSamplesOutsideLand,
    sourceLandCoveragePass,
    sourceSeaLeakPass,
    landCoveragePass,
    seaLeakPass,
    presentationContract,
    pass: landCoveragePass && seaLeakPass,
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
