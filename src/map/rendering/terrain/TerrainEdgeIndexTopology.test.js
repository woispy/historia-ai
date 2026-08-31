import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
const positions=new Float32Array(Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).flat());
function area(indices,size){let total=0;for(let i=0;i<indices.length;i+=3){const p=[indices[i],indices[i+1],indices[i+2]].map(v=>[v%size,Math.floor(v/size)]);total+=Math.abs((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]))/2;}return total;}
const modes=["same","neighbor-coarser","neighbor-finer","boundary"];
for(const edge of ["north","east","south","west"]){for(const mode of modes){const topology=createTerrainEdgeIndexTopology({size:5,edges:{[edge]:mode}});assert.equal(topology.vertexCount,25);assert.ok(topology.indexCount>0);assert.equal(topology.edges[edge],mode);validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});if(mode==="neighbor-coarser")assert.equal(area(topology.indices,5),16,`${edge} stitch must preserve tile area`);}}
assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{north:"neighbor-coarser",east:"neighbor-finer"}}),/dedicated corner topology/);
assert.throws(()=>createTerrainEdgeIndexTopology({size:4}),/odd integer/);assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{east:"invalid"}}),/Unknown terrain edge mode/);console.log("Phase E generated terrain topology validation: PASS");
