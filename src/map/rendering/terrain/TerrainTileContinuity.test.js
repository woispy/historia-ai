import assert from "node:assert/strict";
import { assertTerrainTileContinuity, validateTerrainTileContinuity } from "./TerrainTileContinuity.js";

function tile(values) { return { width:3,height:3,samples:new Float32Array(values) }; }
const west = tile([10,20,30,40,50,60,70,80,90]);
const east = tile([30,100,110,20,200,210,10,300,310]);
assert.deepEqual(validateTerrainTileContinuity(west,east,{edgeA:"east",edgeB:"west",tolerance:0}),{continuous:true,maxDifference:0,sampleCount:3,tolerance:0});
const mismatch = tile([31,100,110,21,200,210,11,300,310]);
assert.equal(validateTerrainTileContinuity(west,mismatch,{edgeA:"east",edgeB:"west",tolerance:0.5}).continuous,false);
assert.throws(()=>assertTerrainTileContinuity(west,mismatch,{edgeA:"east",edgeB:"west",tolerance:0.5}),/discontinuity/);
assert.throws(()=>validateTerrainTileContinuity(west,tile([1,2,3,4]),{edgeA:"east",edgeB:"west"}),/dimensions/);
console.log("Phase E terrain tile continuity: PASS");
