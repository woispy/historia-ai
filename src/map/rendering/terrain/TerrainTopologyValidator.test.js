import assert from "node:assert/strict";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
const valid=new Uint32Array([0,1,3,1,4,3]);const result=validateTerrainIndexTopology({indices:valid,vertexCount:5,positions:new Float32Array([0,0,1,0,0,1,0,1,1,1])});assert.equal(result.triangleCount,2);assert.equal(result.uniqueTriangleCount,2);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,5]),vertexCount:5}),/out of bounds/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,1]),vertexCount:3}),/degenerate/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,2,2,1,0]),vertexCount:3}),/Duplicate/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1]),vertexCount:3}),/triangle alignment/);
console.log("Phase E terrain topology validator: PASS");
