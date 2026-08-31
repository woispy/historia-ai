import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainTriangleCoverage } from "./TerrainTriangleCoverageValidator.js";
function xy(size){return new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());}
const size=5;const positions=xy(size);
for(const edge of ["north","east","south","west"]){const topology=createTerrainEdgeIndexTopology({size,edges:{[edge]:"neighbor-coarser"}});const result=validateTerrainTriangleCoverage({indices:topology.indices,positions,size});assert.equal(result.completeAreaCoverage,true,`${edge} single-edge transition must preserve area`);}
for(const [a,b] of [["north","east"],["north","west"],["south","east"],["south","west"]]){const topology=createTerrainEdgeIndexTopology({size,edges:{[a]:"neighbor-coarser",[b]:"neighbor-coarser"}});const result=validateTerrainTriangleCoverage({indices:topology.indices,positions,size});assert.equal(result.completeAreaCoverage,false,`${a}+${b} must remain blocked until corner topology is implemented`);}
console.log("Phase E stitched topology transition audit: PASS");
