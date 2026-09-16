import assert from "node:assert/strict";
import { buildMeshTopologyReport } from "../historical-gis/MeshTopologyEngine.js";

const vertices = [[0,0],[2,0],[2,2],[0,2],[10,10],[11,10],[10,11]];
const indices = new Uint32Array([0,1,3,1,2,3,4,5,6]);
const report = buildMeshTopologyReport({ vertices, indices, cellSize: 2 });
assert.equal(report.valid, true);
assert.equal(report.triangles.length, 3);
assert.deepEqual(report.candidatePairs, [[0,1]]);
assert.deepEqual(report.relations, [{a:0,b:1,relation:"shared-edge"}]);
assert.deepEqual(report, buildMeshTopologyReport({ vertices, indices, cellSize: 2 }));

const crossing = buildMeshTopologyReport({
  vertices: [[0,0],[3,3],[0,3],[3,0]],
  indices: new Uint32Array([0,1,2,0,3,1]),
  cellSize: 4,
});
assert.equal(crossing.valid, false);
assert.ok(crossing.errors.some((error) => error.includes("crossing")));
console.log("Mesh topology engine regression passed.");
