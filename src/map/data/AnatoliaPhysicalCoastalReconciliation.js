/**
 * Curated physical-land reconciliation for coastline detail that is intentionally
 * finer than the lightweight AnatoliaPhysicalAtlas land mask.
 *
 * These polygons are physical geography, not political ownership. They exist
 * only where the coarse atlas would otherwise classify a known coastal
 * peninsula as water and force province fallbacks onto a neighbouring landmass.
 */

const BODRUM_PENINSULA = Object.freeze([
  [27.32, 37.10],
  [27.39, 37.14],
  [27.48, 37.12],
  [27.55, 37.07],
  [27.54, 36.99],
  [27.48, 36.94],
  [27.39, 36.96],
  [27.33, 37.02],
  [27.32, 37.10],
]);

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const crosses = (yi > y) !== (yj > y)
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export const PHYSICAL_LAND_RECONCILIATION_POLYGONS = Object.freeze([
  BODRUM_PENINSULA,
]);

export function pointInPhysicalLandReconciliation(point) {
  return PHYSICAL_LAND_RECONCILIATION_POLYGONS.some((polygon) => pointInPolygon(point, polygon));
}
