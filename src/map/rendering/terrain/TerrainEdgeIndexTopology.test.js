import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
const same=createTerrainEdgeIndexTopology({size:5,edges:{}});
assert.equal(same.vertexCount,25);assert.equal(same.indexCount,96);assert.equal(same.transitionEdges.length,0);
const stitched=createTerrainEdgeIndexTopology({size:5,edges:{north:"neighbor-coarser"}});
assert.equal(stitched.transitionEdges.length,1);assert.equal(stitched.transitionEdges[0],"north");assert.ok(stitched.indices instanceof Uint32Array);assert.ok(stitched.indexCount>same.indexCount);
assert.throws(()=>createTerrainEdgeIndexTopology({size:4}),/odd integer/);
assert.throws(()=>createTerrainEdgeIndexTopology({size:5,edges:{east:"invalid"}}),/Unknown terrain edge mode/);
console.log("Phase E edge index topology: PASS");
