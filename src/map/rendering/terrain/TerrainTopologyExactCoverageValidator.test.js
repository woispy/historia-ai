import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainExactCellCoverage } from "./TerrainTopologyExactCoverageValidator.js";
const size=5;const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());const topology=createTerrainEdgeIndexTopology({size,edges:{}});const result=validateTerrainExactCellCoverage({indices:topology.indices,positions,size});assert.equal(result.completeExactCoverage,true);assert.equal(result.uncoveredArea,0);assert.equal(result.overlapArea,0);console.log("Phase E exact terrain coverage: PASS");
