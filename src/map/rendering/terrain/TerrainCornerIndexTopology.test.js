import assert from "node:assert/strict";
import { createTerrainCornerIndexTopology, CORNERS } from "./TerrainCornerIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
const size=5;const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());
for(const corner of CORNERS){const topology=createTerrainCornerIndexTopology({size,corner});assert.ok(topology.indexCount>0);assert.equal(topology.vertexCount,size*size);validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});const unique=new Set();for(let i=0;i<topology.indices.length;i+=3)unique.add([topology.indices[i],topology.indices[i+1],topology.indices[i+2]].sort((a,b)=>a-b).join(":"));assert.equal(unique.size,topology.indexCount/3);}
console.log("Phase E dedicated corner topology invariants: PASS");
