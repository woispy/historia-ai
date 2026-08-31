import assert from "node:assert/strict";
import { derivePhysicalGradients } from "./TerrainPhysicalGradient.js";

const flat = derivePhysicalGradients({ heights: Float32Array.from([100,100,100,100]), width: 2, height: 2, spacingX: 90, spacingY: 90 });
assert.deepEqual(Array.from(flat.slope), [0,0,0,0]);
for (let i = 0; i < flat.normals.length; i += 3) assert.deepEqual(Array.from(flat.normals.slice(i, i + 3)), [0,1,0]);
const ramp = derivePhysicalGradients({ heights: Float32Array.from([0,10,0,10]), width: 2, height: 2, spacingX: 10, spacingY: 10 });
assert.ok(ramp.slope.every((value) => value > 0));
assert.ok(ramp.normals.some((value, i) => i % 3 === 0 && value !== 0));
const nodata = derivePhysicalGradients({ heights: Float32Array.from([0,-9999,0,0]), width: 2, height: 2, spacingX: 10, spacingY: 10, noDataValue: -9999 });
assert.equal(nodata.slope[1], 0);
assert.deepEqual(Array.from(nodata.normals.slice(3,6)), [0,1,0]);
assert.throws(() => derivePhysicalGradients({ heights: [0,1,2,3], width: 2, height: 2, spacingX: 0, spacingY: 10 }), /positive meters/);
console.log("Phase E physical terrain gradient: PASS");
