import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
const modes=["same","neighbor-coarser","neighbor-finer","boundary"];
for(const edge of ["north","east","south","west"]){for(const mode of modes){const topology=createTerrainEdgeIndexTopology({size:5,edges:{[edge]:mode}});assert.equal(topology.vertexCount,25);assert.ok(topology.indexCount>0);assert.equal(topology.edges[edge],mode);}}
const corners=[{north:"neighbor-coarser",east:"neighbor-coarser"},{east:"neighbor-finer",south:"neighbor-coarser"},{south:"neighbor-finer",west:"neighbor-finer"},{west:"neighbor-coarser",north:"neighbor-finer"}];
for(const edges of corners)assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges}),/corner stitch topology/);
assert.throws(()=>createTerrainEdgeIndexTopology({size:4}),/odd integer/);
assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{east:"invalid"}}),/Unknown terrain edge mode/);
console.log("Phase E terrain edge topology combinations: PASS");
