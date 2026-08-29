import assert from "node:assert/strict";
import { convexCellMaskIntersection, pointInPolygon } from "../historical-gis/Phase2DConvexMaskIntersection.js";

const cell = [[29.4, 40.5], [30.1, 40.5], [30.1, 41.0], [29.4, 41.0]];
const mask = [[29.0, 40.8], [29.5, 40.6], [30.0, 40.7], [30.2, 41.0], [29.7, 41.2], [29.1, 41.1], [29.0, 40.8]];
const intersection = convexCellMaskIntersection(cell, mask);
assert.ok(intersection.length >= 3, "intersection must contain a polygon");
assert.ok(intersection.every((point) => pointInPolygon(point, cell)), "intersection vertices must remain in cell");
assert.ok(intersection.every((point) => pointInPolygon(point, mask)), "intersection vertices must remain in mask");
console.log(JSON.stringify({ pointCount: intersection.length, intersection }));
