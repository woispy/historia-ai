import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainTriangleCoverage } from "./TerrainTriangleCoverageValidator.js";
const size=5;const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%(size),Math.floor(i/size)]).flat());const topology=createTerrainEdgeIndexTopology({size,edges:{}});const result=validateTerrainTriangleCoverage({indices:topology.indices,positions,size});assert.equal(result.completeAreaCoverage,true);assert.equal(result.areaDifference,0);
const partial=new Uint32Array(topology.indices.slice(0,-6));const partialResult=validateTerrainTriangleCoverage({indices:partial,positions,size});assert.equal(partialResult.completeAreaCoverage,false);assert.ok(partialResult.areaDifference>0);
console.log("Phase E terrain triangle area coverage: PASS");
