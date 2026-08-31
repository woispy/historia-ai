import assert from "node:assert/strict";
import { buildIndexedProvincePack, buildLodRings, normalizeRing, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const concave = [[0, 0], [4, 0], [4, 1], [2, 1], [2, 3], [0, 3], [0, 0]];
const withCollinear = [[0, 0], [2, 0], [4, 0], [4, 2], [2, 2], [0, 2], [0, 0]];
const reversed = [...concave].reverse();

assert.equal(normalizeRing(concave).length, 6);
assert.equal(triangulateRing(concave).length, 12);
assert.equal(triangulateRing(reversed).length, 12);
assert.equal(triangulateRing(withCollinear).length, 6);

const lods = buildLodRings(concave);
for (const ring of lods) {
  if (ring.length >= 3) assert.equal(triangulateRing(ring).length % 3, 0);
}

const pack = buildIndexedProvincePack([
  { province: { id: "concave" }, geometry: { polygons: [concave] } },
  { province: { id: "collinear" }, geometry: { polygons: [withCollinear] } },
]);

assert.equal(pack.version, 2);
assert.equal(pack.provinces.length, 2);
assert.equal(pack.indices.length % 3, 0);
for (const province of pack.provinces) {
  for (const range of province.lodRanges) assert.equal(range.indexCount % 3, 0);
}

console.log("GPU province triangulation contract: PASS");
