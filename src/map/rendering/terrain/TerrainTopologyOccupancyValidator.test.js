import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainCellOccupancy } from "./TerrainTopologyOccupancyValidator.js";
const size=5;const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());const topology=createTerrainEdgeIndexTopology({size,edges:{}});const result=validateTerrainCellOccupancy({indices:topology.indices,positions,size});assert.equal(result.cellCount,16);assert.equal(result.uncoveredCells,0);assert.equal(result.overlapCells,0);assert.equal(result.completeCellCoverage,true);
console.log("Phase E terrain cell occupancy: PASS");
