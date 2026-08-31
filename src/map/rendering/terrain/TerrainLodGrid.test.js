import assert from "node:assert/strict";
import { buildCoarseEdgeConstraints, sampleNestedLodEdge, validateNestedLodGrid } from "./TerrainLodGrid.js";

assert.equal(validateNestedLodGrid({ parentSize: 5, childSize: 9 }), true);
assert.throws(() => validateNestedLodGrid({ parentSize: 5, childSize: 8 }), /2:1/);
const fine = Float32Array.from({ length: 81 }, (_, i) => i);
assert.equal(sampleNestedLodEdge({ values: fine, size: 9, edge: "top", index: 4 }), 4);
assert.deepEqual(Array.from(buildCoarseEdgeConstraints({ fineValues: fine, fineSize: 9, coarseSize: 5, edge: "top" })), [0,2,4,6,8]);
assert.deepEqual(Array.from(buildCoarseEdgeConstraints({ fineValues: fine, fineSize: 9, coarseSize: 5, edge: "left" })), [0,18,36,54,72]);
console.log("Phase E nested LOD edge continuity: PASS");
