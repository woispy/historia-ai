/**
 * Diagnose Phase 2D province-anchor rejection without changing production
 * geometry rules. This reports every anchor against the static land mask and
 * every generated Natural Earth 10m lake so anchor fixes are data-driven.
 */
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const EPS = 1e-9;
const pointInPolygon = (point, polygon) => {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
};

const anchorFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.geometryAnchor
  ?? ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor
  ?? item.centroid;

const staticLand = ANATOLIA_PHYSICAL_ATLAS.landPolygons;
const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes;

const diagnostics = ANATOLIA_PROVINCE_METADATA.map((item) => {
  const point = anchorFor(item);
  const land = staticLand.some((polygon) => pointInPolygon(point, polygon));
  const matchingLakes = lakes.filter((lake) => pointInPolygon(point, lake.coordinates));
  return {
    id: item.id,
    point,
    staticLand: land,
    lakeCount: matchingLakes.length,
    lakes: matchingLakes.map((lake) => ({ id: lake.id, name: lake.name, bounds: lake.bounds })),
  };
});

const rejectedByLake = diagnostics.filter((item) => !item.staticLand || item.lakeCount > 0);

console.log(`Phase 2D anchor diagnostics: ${diagnostics.length} province anchors inspected.`);
for (const item of rejectedByLake) {
  console.log(JSON.stringify(item));
}

if (!rejectedByLake.length) {
  console.log("No anchor conflicts with the static land mask or generated 10m lakes.");
}