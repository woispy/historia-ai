import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainExactCellCoverage } from "./TerrainTopologyExactCoverageValidator.js";
const size=3;const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());const topology=createTerrainEdgeIndexTopology({size,edges:{}});const result=validateTerrainExactCellCoverage({indices:topology.indices,positions,size});assert.equal(result.completeExactCoverage,true);assert.equal(result.uncoveredArea,0);assert.equal(result.overlapArea,0);
const missing=new Uint32Array(topology.indices.slice(0,-3));const gap=validateTerrainExactCellCoverage({indices:missing,positions,size});assert.equal(gap.completeExactCoverage,false);assert.ok(gap.uncoveredArea>0);
const overlap=new Uint32Array([...topology.indices,...topology.indices.slice(0,3)]);const over=validateTerrainExactCellCoverage({indices:overlap,positions,size});assert.equal(over.completeExactCoverage,false);assert.ok(over.overlapArea>0);
console.log("Phase E exact terrain gap/overlap coverage: PASS");
