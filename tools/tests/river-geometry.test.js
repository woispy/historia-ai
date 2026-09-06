import assert from "node:assert/strict";
import { buildLineGeometry } from "../../src/map/rendering/gpu/ProductionPhysicalMapLayer.js";

const coordinates = [[30, 40], [31, 41], [32, 42], [33, 43]];
const openRiver = buildLineGeometry([{ coordinates }]);
assert.deepEqual(Array.from(openRiver.vertices), [30,40,31,41,31,41,32,42,32,42,33,43]);

const closedCoast = buildLineGeometry([{ coordinates }], false, true);
assert.deepEqual(Array.from(closedCoast.vertices), [30,40,31,41,31,41,32,42,32,42,33,43,33,43,30,40]);

console.log("River open-polyline + closed-coast geometry regression: PASS");
