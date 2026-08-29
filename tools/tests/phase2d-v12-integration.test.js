import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";
import { getPhysicalLandPolygons, pointInPolygon } from "../historical-gis/Phase2DPhysicalMask.js";
import { convexCellMaskIntersection } from "../historical-gis/Phase2DConvexMaskIntersection.js";

const anchor = ANATOLIA_PROVINCE_REFINEMENTS["bithynia-nicomedia"].geometryAnchor;
const mask = getPhysicalLandPolygons().find((polygon) => pointInPolygon(anchor, polygon));
assert.ok(mask, "Nicomedia anchor must have a containing physical mask polygon");
const cell = [[29.40, 40.64], [30.10, 40.64], [30.20, 41.05], [29.40, 41.10]];
const intersection = convexCellMaskIntersection(cell, mask);
assert.ok(intersection.length >= 3, "Nicomedia representative cell must intersect physical mask");
assert.ok(pointInPolygon(anchor, intersection) || intersection.some((point) => Math.hypot(point[0] - anchor[0], point[1] - anchor[1]) < 0.25), "Nicomedia intersection must remain near its anchor");
console.log(JSON.stringify({ provinceId: "bithynia-nicomedia", anchor, intersection }));
