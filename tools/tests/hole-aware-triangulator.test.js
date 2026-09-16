import assert from "node:assert/strict";
import { triangulateMultiRingPolygon } from "../historical-gis/HoleAwareTriangulator.js";

function ringArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(area * 0.5);
}
function triangleArea(points, indices) {
  let total = 0;
  for (let i = 0; i < indices.length; i += 3) {
    total += ringArea([points[indices[i]], points[indices[i + 1]], points[indices[i + 2]]]);
  }
  return total;
}

const outer = [[0, 0], [10, 0], [10, 10], [0, 10]];
const hole = [[2, 2], [4, 2], [4, 4], [2, 4]];

const result = triangulateMultiRingPolygon({ outerRing: outer, holes: [hole] });
assert.ok(result.indices.length > 0);
assert.ok(Math.abs(triangleArea(result.vertices, result.indices) - (ringArea(outer) - ringArea(hole))) < 1e-8);

const islands = triangulateMultiRingPolygon({ outerRing: outer, islands: [[[20, 20], [22, 20], [22, 22]]] });
assert.equal(islands.componentCount, 2);
assert.ok(islands.indices.length > 0);

console.log("Hole-aware triangulation contract passed: hole subtraction and independent island components are guarded.");
