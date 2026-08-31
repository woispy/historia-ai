import assert from "node:assert/strict";
import { createTerrainHeightSampler } from "./TerrainHeightSampler.js";
import { validateTerrainProvinceParity } from "./TerrainSpatialParity.js";

const sampler = createTerrainHeightSampler({ bounds:{minX:30,minY:40,maxX:31,maxY:41}, width:3,height:3,spacingX:30,spacingY:30,samples:Float32Array.from([0,10,20,10,20,30,20,30,40]) });
const geometry = { positions:new Float32Array([30,40,31,40,30,41]) };
const result = validateTerrainProvinceParity({ provinceGeometry:geometry, terrainSampler:sampler, terrainTileId:"3/10/20" });
assert.equal(result.vertexCount,3); assert.deepEqual(result.samples.map((point)=>[point.x,point.y,point.height]), [[0,0,0],[30,0,10],[0,30,20]]);
assert.throws(()=>validateTerrainProvinceParity({provinceGeometry:{positions:new Float32Array([31.1,40])},terrainSampler:sampler,terrainTileId:"3/10/20"}),/outside terrain tile/);
assert.throws(()=>validateTerrainProvinceParity({provinceGeometry:geometry,terrainSampler:{...sampler,tileId:"3/10/21"},terrainTileId:"3/10/20"}),/does not match/);
console.log("Phase E terrain province spatial parity: PASS");
