import assert from "node:assert/strict";
import { triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

function area(ring) { let s = 0; for (let i = 0; i < ring.length; i += 1) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function triangleArea(ring, indices) { return indices.reduce((sum, _, i) => i % 3 === 0 ? sum + area([ring[indices[i]], ring[indices[i + 1]], ring[indices[i + 2]]]) : sum, 0); }

const cases = [
  [[0, 0], [4, 0], [4, 1], [2, 0.2], [0, 1]],
  [[0, 0], [3, 0], [4, 1], [3, 3], [1.5, 1.5], [0, 3]],
  [[0, 0], [5, 0], [5, 5], [3, 4], [2, 5], [0, 5]],
];
for (const ring of cases) {
  const triangles = triangulateRing(ring, { provinceId: "regression" });
  assert.equal(triangles.length, (ring.length - 2) * 3);
  assert.ok(triangles.every((index) => Number.isInteger(index) && index >= 0 && index < ring.length));
  assert.ok(Math.abs(triangleArea(ring, triangles) - area(ring)) < 1e-8);
}
console.log(`GPU triangulation regression: ${cases.length} cases passed.`);
