import assert from "node:assert/strict";
import { triangulateMultiRingPolygon } from "../historical-gis/HoleAwareTriangulator.js";

function polygonArea(ring) { let a=0; for(let i=0;i<ring.length;i+=1){const p=ring[i],q=ring[(i+1)%ring.length];a+=p[0]*q[1]-q[0]*p[1];} return Math.abs(a*.5); }
function trianglesArea(vertices, indices) { let a=0; for(let i=0;i<indices.length;i+=3){const p=vertices[indices[i]],q=vertices[indices[i+1]],r=vertices[indices[i+2]];a+=Math.abs(((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))*.5);} return a; }
function areaResult(result) { return trianglesArea(result.vertices, Array.from(result.indices)); }

const cases = [
  { name:"concave outer + hole", outer:[[0,0],[12,0],[12,10],[7,10],[6,6],[5,10],[0,10]], holes:[[[2,2],[4,2],[4,4],[2,4]]], expected: polygonArea([[0,0],[12,0],[12,10],[7,10],[6,6],[5,10],[0,10]]) - polygonArea([[2,2],[4,2],[4,4],[2,4]]) },
  { name:"two holes", outer:[[0,0],[14,0],[14,12],[0,12]], holes:[[[2,2],[4,2],[4,4],[2,4]],[[8,6],[11,6],[11,9],[8,9]]], expected:144-4-9 },
  { name:"narrow corridor", outer:[[0,0],[12,0],[12,4],[7,4],[7,8],[12,8],[12,12],[0,12]], holes:[[[1,2],[3,2],[3,10],[1,10]]], expected:polygonArea([[0,0],[12,0],[12,4],[7,4],[7,8],[12,8],[12,12],[0,12]])-16 },
  { name:"outer + island", outer:[[0,0],[10,0],[10,10],[0,10]], islands:[[[3,3],[5,3],[5,5],[3,5]]], expected:100+4 },
];

for (const test of cases) {
  const result = triangulateMultiRingPolygon(test);
  assert.ok(result.indices.length > 0, `${test.name}: no triangles`);
  assert.ok(Math.abs(areaResult(result)-test.expected) < 1e-7, `${test.name}: area mismatch`);
  assert.deepEqual(result, triangulateMultiRingPolygon(test), `${test.name}: non-deterministic output`);
}

console.log("Hole-aware adversarial triangulation contract passed.");
