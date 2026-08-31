import assert from "node:assert/strict";
import { buildLodSeamIndices, validateLodSeamIndexRange } from "./TerrainLodSeam.js";

for (const edge of ["top", "bottom", "left", "right"]) {
  const indices = buildLodSeamIndices({ fineSize: 9, coarseSize: 5, edge });
  assert.equal(indices.length, 36);
  assert.equal(validateLodSeamIndexRange(indices, 9, 5), true);
}
assert.throws(() => buildLodSeamIndices({ fineSize: 8, coarseSize: 5, edge: "top" }), /2:1/);
assert.throws(() => buildLodSeamIndices({ fineSize: 9, coarseSize: 5, edge: "diagonal" }), /Unknown/);
console.log("Phase E explicit LOD seam topology: PASS");
