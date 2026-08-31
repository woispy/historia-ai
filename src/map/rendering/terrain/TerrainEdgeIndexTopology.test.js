import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
const modes=["same","neighbor-coarser","neighbor-finer","boundary"];
for(const north of modes)for(const east of modes){const topology=createTerrainEdgeIndexTopology({size:5,edges:{north,east}});assert.equal(topology.vertexCount,25);assert.ok(topology.indexCount>0);assert.equal(topology.edges.north,north);assert.equal(topology.edges.east,east);}
const corners=createTerrainEdgeIndexTopology({size:5,edges:{north:"neighbor-coarser",east:"neighbor-coarser",south:"neighbor-finer",west:"neighbor-finer"}});
assert.equal(corners.transitionEdges.length,4);assert.ok(corners.indices instanceof Uint32Array);
assert.throws(()=>createTerrainEdgeIndexTopology({size:4}),/odd integer/);
assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{north:"invalid"}}),/Unknown terrain edge mode/);
console.log("Phase E terrain edge topology combinations: PASS");
