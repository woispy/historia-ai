import assert from "node:assert/strict";
import { validateIndexedMeshTopology } from "../historical-gis/MeshTopologyValidator.js";

const square = [[0,0],[10,0],[10,10],[0,10]];
const valid = validateIndexedMeshTopology({ vertices:square, indices:Uint32Array.from([0,1,2,0,2,3]), expectedArea:100 });
assert.equal(valid.valid, true, valid.errors.join("; "));
assert.equal(valid.triangleCount, 2);
assert.ok(Math.abs(valid.area-100) < 1e-7);

const degenerate = validateIndexedMeshTopology({ vertices:[[0,0],[1,0],[2,0]], indices:Uint32Array.from([0,1,2]), expectedArea:0 });
assert.equal(degenerate.valid, false);
assert.ok(degenerate.errors.some((error) => error.includes("degenerate")));

const crossing = validateIndexedMeshTopology({ vertices:[[0,0],[4,4],[0,4],[4,0],[2,-1],[2,5]], indices:Uint32Array.from([0,1,2,3,4,5]) });
assert.equal(crossing.valid, false);
assert.ok(crossing.errors.some((error) => error.includes("intersect")));

console.log("Indexed mesh topology validator contract passed.");
