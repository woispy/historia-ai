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
assert.ok(crossing.errors.some((error) => error.includes("crossing")));

const sharedVertex = validateIndexedMeshTopology({ vertices:[[0,0],[2,0],[0,2],[2,2],[4,0]], indices:Uint32Array.from([0,1,2,1,3,2]) });
assert.equal(sharedVertex.valid, true, sharedVertex.errors.join("; "));

const tJunction = validateIndexedMeshTopology({ vertices:[[0,0],[4,0],[0,4],[2,0],[5,2],[2,5]], indices:Uint32Array.from([0,1,2,3,4,5]) });
assert.equal(tJunction.valid, false);
assert.ok(tJunction.errors.some((error) => error.includes("t-junction")));

const partialEdgeOverlap = validateIndexedMeshTopology({ vertices:[[0,0],[4,0],[0,4],[2,0],[5,0],[2,3]], indices:Uint32Array.from([0,1,2,3,4,5]) });
assert.equal(partialEdgeOverlap.valid, false);
assert.ok(partialEdgeOverlap.errors.some((error) => error.includes("partial-edge-overlap")));

const contained = validateIndexedMeshTopology({ vertices:[[0,0],[6,0],[0,6],[1,1],[2,1],[1,2]], indices:Uint32Array.from([0,1,2,3,4,5]) });
assert.equal(contained.valid, false);
assert.ok(contained.errors.some((error) => error.includes("overlap")));

const duplicateTriangle = validateIndexedMeshTopology({ vertices:[[0,0],[4,0],[0,4]], indices:Uint32Array.from([0,1,2,2,1,0]) });
assert.equal(duplicateTriangle.valid, false);
assert.ok(duplicateTriangle.errors.some((error) => error.includes("duplicate-triangle")));

console.log("Indexed mesh topology validator contract passed: shared edges/vertices accepted; crossing, T-junction, partial overlap, containment, and duplicate triangles rejected.");
