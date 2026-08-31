import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";

function positions(size){const out=new Float32Array(size*size*2);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*2;out[i]=x;out[i+1]=y;}return out;}
for(const mode of ["same","neighbor-coarser","neighbor-finer","boundary"]){const topology=createTerrainEdgeIndexTopology({size:5,edges:{north:mode}});const result=validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions:positions(5),expectedWinding:"cw"});assert.equal(result.degenerateCount,0);assert.equal(result.windingViolations,0);}
for(const edges of [{north:"neighbor-coarser",east:"neighbor-coarser"},{south:"neighbor-finer",west:"neighbor-finer"},{north:"neighbor-coarser",south:"neighbor-coarser",east:"neighbor-coarser",west:"neighbor-coarser"}]){const topology=createTerrainEdgeIndexTopology({size:5,edges});const result=validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions:positions(5),expectedWinding:"cw"});assert.equal(result.degenerateCount,0);assert.equal(result.windingViolations,0);assert.equal(result.triangleCount,result.uniqueTriangleCount);}
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,5]),vertexCount:5}),/out of bounds/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,1]),vertexCount:3}),/degenerate/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,1,2,2,1,0]),vertexCount:3}),/Duplicate/);
assert.throws(()=>validateTerrainIndexTopology({indices:new Uint32Array([0,2,1]),vertexCount:3,positions:new Float32Array([0,0,1,0,0,1]),expectedWinding:"cw"}),/inconsistent winding/);
console.log("Phase E generated terrain topology invariants: PASS");
