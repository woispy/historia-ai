import assert from "node:assert/strict";
import { buildTriangleSpatialIndex, candidateTrianglePairs } from "../historical-gis/TriangleSpatialIndex.js";

const triangles = [
  { points: [[0,0],[2,0],[0,2]] },
  { points: [[2,0],[2,2],[0,2]] },
  { points: [[10,10],[11,10],[10,11]] },
  { points: [[1,1],[3,1],[1,3]] },
];

const index = buildTriangleSpatialIndex(triangles, { cellSize: 2 });
const pairs = candidateTrianglePairs(triangles, index);
assert.deepEqual(pairs, [[0,1],[0,3],[1,3]]);
assert.deepEqual(pairs, candidateTrianglePairs(triangles, index));
assert.ok(!pairs.some(([a,b]) => (a === 0 && b === 2) || (a === 1 && b === 2) || (a === 2 && b === 3)));
console.log("Triangle spatial broad-phase regression passed.");
