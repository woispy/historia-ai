import assert from "node:assert/strict";
import { buildSimplePolygonMesh } from "../historical-gis/PolygonMeshBuilder.js";

const ring = [[0, 0], [4, 0], [4, 4], [2, 1], [0, 4]];
const mesh = buildSimplePolygonMesh({ provinceId: "test-province", geometryId: "test-geometry", outerRing: ring });

assert.equal(mesh.provinceId, "test-province");
assert.equal(mesh.geometryId, "test-geometry");
assert.equal(mesh.vertexCount, ring.length);
assert.equal(mesh.indexCount, (ring.length - 2) * 3);
assert.equal(mesh.vertices.length, ring.length * 2);
assert.equal(mesh.indices.length, mesh.indexCount);
assert.equal(mesh.vertices[0], 0);
assert.equal(mesh.vertices[2], 4);
assert.deepEqual(Array.from(mesh.indices), [4, 0, 1, 1, 2, 3, 3, 4, 1]);
assert.throws(() => buildSimplePolygonMesh({ provinceId: "lake-test", geometryId: "lake-test", outerRing: ring, holes: [[[1,1],[2,1],[2,2]]] }), /simple single-ring/);

console.log("Polygon mesh builder contract passed: identity, immutable source coordinates, and indexed topology are guarded.");
