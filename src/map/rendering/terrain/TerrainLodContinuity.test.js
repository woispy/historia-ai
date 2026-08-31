import assert from "node:assert/strict";
import { assertTerrainLodEdgeContinuity, validateTerrainLodEdgeContinuity } from "./TerrainLodContinuity.js";
const coarse={width:2,height:2,samples:new Float32Array([0,10,20,30])};
const fine={width:3,height:3,samples:new Float32Array([0,5,10,10,15,20,20,25,30])};
const result=validateTerrainLodEdgeContinuity(coarse,fine,{coarseEdge:"east",fineEdge:"west",tolerance:0});
assert.equal(result.continuous,true);assert.equal(result.sampleCount,2);assertTerrainLodEdgeContinuity(coarse,fine,{coarseEdge:"east",fineEdge:"west",tolerance:0});
const mismatch={...fine,samples:new Float32Array([0,6,10,10,16,20,20,26,30])};assert.equal(validateTerrainLodEdgeContinuity(coarse,mismatch,{coarseEdge:"east",fineEdge:"west",tolerance:0.5}).continuous,false);
console.log("Phase E LOD continuity: PASS");
