import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
const positions=new Float32Array(Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).flat());
const modes=["same","neighbor-coarser","neighbor-finer","boundary"];
for(const edge of ["north","east","south","west"]){for(const mode of modes){const topology=createTerrainEdgeIndexTopology({size:5,edges:{[edge]:mode}});assert.equal(topology.vertexCount,25);assert.ok(topology.indexCount>0);assert.equal(topology.edges[edge],mode);validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});}}
const corners=[{north:"neighbor-coarser",east:"neighbor-coarser"},{east:"neighbor-finer",south:"neighbor-finer"},{south:"neighbor-coarser",west:"neighbor-coarser"},{west:"neighbor-finer",north:"neighbor-finer"}];
for(const edges of corners){const topology=createTerrainEdgeIndexTopology({size:5,edges});assert.equal(topology.transitionEdges.length,2);validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});}
assert.throws(()=>createTerrainEdgeIndexTopology({size:4}),/odd integer/);assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{east:"invalid"}}),/Unknown terrain edge mode/);console.log("Phase E generated terrain topology validation: PASS");
