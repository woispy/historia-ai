import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";
import { getPhysicalLandPolygons, isPhysicalLandPoint, pointInPolygon, polygonArea } from "../historical-gis/Phase2DPhysicalMask.js";

const item = ANATOLIA_PROVINCE_METADATA.find((province) => province.id === "bithynia-nicomedia");
assert.ok(item, "Nicomedia metadata missing");
const refinement = ANATOLIA_PROVINCE_REFINEMENTS[item.id];
const anchor = refinement.geometryAnchor;
const containingPolygons = getPhysicalLandPolygons().filter((polygon) => pointInPolygon(anchor, polygon));
const landPoint = isPhysicalLandPoint(anchor);
const areas = containingPolygons.map((polygon) => polygonArea(polygon));

console.log(JSON.stringify({
  provinceId: item.id,
  anchor,
  isPhysicalLandPoint: landPoint,
  containingPolygonCount: containingPolygons.length,
  containingPolygonAreas: areas,
  totalPhysicalLandPolygonCount: getPhysicalLandPolygons().length,
}));

assert.equal(landPoint, true, "Nicomedia geometry anchor must be physical land");
assert.ok(containingPolygons.length > 0, "Nicomedia anchor must be inside canonical physical land geometry");
