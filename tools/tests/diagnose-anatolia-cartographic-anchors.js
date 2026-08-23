import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { applyAnatoliaProvinceCartographicOverrides } from "../../src/map/data/AnatoliaProvinceCartographicOverrides.js";

function pointOnSegment(point, start, end, epsilon = 1e-9) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > epsilon) return false;
  return x >= Math.min(x1, x2) - epsilon
    && x <= Math.max(x1, x2) + epsilon
    && y >= Math.min(y1, y2) - epsilon
    && y <= Math.max(y1, y2) + epsilon;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;

  // Keep `previous` on the preceding vertex. This mirrors the production
  // validation algorithm and avoids the old zero-length-edge bug.
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    if (pointOnSegment(point, prior, current)) return true;
    const [xi, yi] = current;
    const [xj, yj] = prior;
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
    previous = index;
  }
  return inside;
}

const effectiveMetadata = ANATOLIA_PROVINCE_METADATA.map((province) => ({
  ...province,
  centroid: [...province.centroid],
}));
applyAnatoliaProvinceCartographicOverrides(effectiveMetadata);

const failures = effectiveMetadata.map((province) => {
  const containing = ANATOLIA_PHYSICAL_ATLAS.landPolygons
    .map((polygon, index) => ({ index, inside: pointInPolygon(province.centroid, polygon), vertices: polygon.length }))
    .filter((result) => result.inside);
  return containing.length > 0 ? null : {
    id: province.id,
    centroid: province.centroid,
    polygonResults: ANATOLIA_PHYSICAL_ATLAS.landPolygons.map((polygon, index) => ({
      index,
      vertices: polygon.length,
      inside: pointInPolygon(province.centroid, polygon),
    })),
  };
}).filter(Boolean);

console.log(JSON.stringify({
  landPolygonCount: ANATOLIA_PHYSICAL_ATLAS.landPolygons.length,
  failedCount: failures.length,
  failures,
}, null, 2));