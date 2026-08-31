import assert from "node:assert/strict";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const count = 15000;
const entries = Array.from({ length: count }, (_, i) => {
  const x = (i % 150) * 1.1;
  const y = Math.floor(i / 150) * 1.1;
  return { province: { id: `stress-${i}` }, geometry: { polygons: [[[x, y], [x + 0.9, y], [x + 0.9, y + 0.9], [x, y + 0.9]]] } };
});
const started = performance.now();
const pack = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
const elapsedMs = performance.now() - started;
assert.equal(pack.provinces.length, count);
assert.ok(pack.vertices.length > 0);
assert.ok(pack.indices.length > 0);
assert.equal(pack.indices.length % 3, 0);
assert.equal(pack.provinces.every((p) => p.lodRanges.length === 4), true);
assert.equal(pack.provinces.every((p) => p.lodRanges.every((r) => r.indexCount % 3 === 0)), true);
assert.equal(pack.provinces.every((p) => p.lodRanges.every((r) => r.firstIndex + r.indexCount <= pack.indices.length)), true);
console.log(`15k GPU province stress passed: ${count} provinces, ${pack.tiles.length} tiles, ${pack.vertices.length / 2} vertices, ${pack.indices.length} indices, ${elapsedMs.toFixed(1)}ms build.`);
