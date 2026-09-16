import assert from "node:assert/strict";
import { benchmarkMeshTopology } from "../historical-gis/MeshTopologyBenchmark.js";

const vertices = [];
const indices = [];
for (let y = 0; y < 10; y += 1) {
  for (let x = 0; x < 10; x += 1) {
    const base = vertices.length;
    vertices.push([x, y], [x + 0.9, y], [x, y + 0.9]);
    indices.push(base, base + 1, base + 2);
  }
}
const result = benchmarkMeshTopology({ vertices, indices, cellSize: 1 });
assert.equal(result.triangleCount, 100);
assert.equal(result.totalPairs, 4950);
assert.ok(result.candidatePairs < result.totalPairs);
assert.ok(result.reductionRatio > 0);
assert.equal(typeof result.elapsedMs, "number");
console.log("Mesh topology benchmark contract passed.");
