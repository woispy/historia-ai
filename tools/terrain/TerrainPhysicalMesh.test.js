import assert from "node:assert/strict";
import { buildPhysicalTerrainGridMesh } from "./TerrainPhysicalMesh.js";

const heights = Float32Array.from([0, 10, 0, 0, 10, 0, 0, 10, 0]);
const mesh = buildPhysicalTerrainGridMesh({ heights, size: 3, spacingX: 100, spacingY: 50 });
assert.deepEqual(Array.from(mesh.positions.slice(0, 9)), [0,0,0,100,0,10,200,0,0]);
assert.deepEqual(Array.from(mesh.uvs.slice(0, 6)), [0,0,0.5,0,1,0]);
assert.equal(mesh.indices.length, 24);
assert.equal(mesh.normals.length, 27);
assert.ok(mesh.normals[1] > 0);
assert.throws(() => buildPhysicalTerrainGridMesh({ heights, size: 3, spacingX: 0, spacingY: 50 }), /positive/);
assert.throws(() => buildPhysicalTerrainGridMesh({ heights: Float32Array.from([0]), size: 1, spacingX: 100, spacingY: 50 }), /square Float32/);
console.log("Phase E physical terrain mesh: PASS");
