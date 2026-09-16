import assert from "node:assert/strict";
import { triangulateSimpleRing, triangulatePolygonRings } from "../historical-gis/DeterministicPolygonTriangulator.js";

function area(points) {
  let value = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    value += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(value * 0.5);
}
function triangleArea(a, b, c) { return Math.abs(((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*0.5); }
function triangleSum(points, indices) { let total=0; for(let i=0;i<indices.length;i+=3) total+=triangleArea(points[indices[i]],points[indices[i+1]],points[indices[i+2]]); return total; }

const convex = [[0,0],[4,0],[4,3],[0,3]];
const concave = [[0,0],[4,0],[4,4],[2,1],[0,4]];
const reversed = [...concave].reverse();
const bowTie = [[0,0],[4,4],[0,4],[4,0]];

for (const ring of [convex, concave, reversed]) {
  const indices = triangulateSimpleRing(ring);
  assert.equal(indices.length, (ring.length - 2) * 3);
  assert.ok(Math.abs(triangleSum(ring, indices) - area(ring)) < 1e-8);
  assert.ok(indices.every((index) => index >= 0 && index < ring.length));
}

assert.deepEqual(triangulateSimpleRing(concave), triangulateSimpleRing(concave));
assert.deepEqual(triangulateSimpleRing(bowTie), []);
assert.throws(() => triangulatePolygonRings(convex, [[[1,1],[2,1],[2,2],[1,2]]]), /holes require/);

console.log("Deterministic triangulation contract passed: convex, concave, winding, self-intersection, and hole boundaries are guarded.");
