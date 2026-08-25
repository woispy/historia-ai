import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const EPS = 1e-9;
const MIN_AREA = 0.00005;

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

/**
 * Single physical-land authority for historical geometry recovery.
 * Coast corrections belong to this physical authority; they are not a
 * second recovery authority.
 */
export const PHYSICAL_LAND_POLYGONS = Object.freeze([
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
].filter((polygon) => polygon?.length >= 3 && Math.abs(signedArea(polygon)) >= MIN_AREA));

export function isPhysicalLandPoint(point) {
  return PHYSICAL_LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon))
    && !ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}
