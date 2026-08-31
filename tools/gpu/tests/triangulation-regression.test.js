import assert from "node:assert/strict";
import { triangulateRing } from "../../../src/map/rendering/gpu/ProvinceGpuPack.js";

function area(ring, triangles) {
  let sum = 0;
  for (let i = 0; i < triangles.length; i += 3) {
    const a = ring[triangles[i]]; const b = ring[triangles[i + 1]]; const c = ring[triangles[i + 2]];
    sum += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  return sum;
}

const cases = [
  [[0,0],[2,0],[4,0],[4,2],[2,2],[0,2]],
  [[0,0],[4,0],[4,4],[2,3],[0,4]],
  [[0,0],[3,0],[3,1],[2,1],[2,3],[1,3],[1,1],[0,1]],
];
for (const ring of cases) {
  const triangles = triangulateRing(ring);
  assert.equal(triangles.length, (ring.length - 2) * 3 - 3, "collinear normalization changes triangle count predictably");
  assert.ok(area(ring, triangles) > 0, "triangulation must contain positive-area triangles");
}
console.log("GPU triangulation regression tests passed.");
