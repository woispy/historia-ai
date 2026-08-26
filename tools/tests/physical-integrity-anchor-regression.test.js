import assert from "node:assert/strict";
import { isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const anchors = [
  ["bithynia-nicaea", [29.72, 40.15]],
  ["pisidia-egirdir", [30.85, 37.98]],
  ["pisidia-beysehir", [31.72, 37.78]],
];

for (const [id, point] of anchors) {
  assert.equal(isPhysicalLandPoint(point), true, `${id} must resolve to physical land`);
}

console.log(`Physical-integrity anchor regressions passed: ${anchors.length} lake-city cases.`);
