import assert from "node:assert/strict";
import {
  buildIndexedProvincePack,
  buildLodRings,
  normalizeRing,
  triangulateRing,
} from "../../src/map/rendering/gpu/ProvinceGpuPack.js";
import {
  createIndirectCommandBuffer,
  createProvinceMetaBufferData,
  validateIndirectCommand,
  writeIndirectCommand,
  PROVINCE_META_BYTES,
} from "../../src/map/rendering/gpu/WebGPUProvincePipeline.js";

const concave = [[0, 0], [10, 0], [10, 4], [6, 4], [6, 10], [0, 10], [0, 0]];
assert.equal(normalizeRing(concave).length, 6);
assert.equal(triangulateRing(concave).length, 12);
assert.equal(triangulateRing([...concave].reverse()).length, 12);

const lods = buildLodRings(concave, [1, 0.75, 0.5, 0.25]);
assert.equal(lods.length, 4);
assert.ok(lods.every((ring) => ring.length >= 3));

const entries = [
  { province: { id: "alpha" }, geometry: { polygons: [concave] } },
  { province: { id: "beta" }, geometry: { polygons: [[[20, 0], [30, 0], [30, 10], [20, 10]]] } },
];
const packA = buildIndexedProvincePack(entries, { tileSize: 10 });
const packB = buildIndexedProvincePack(entries, { tileSize: 10 });

assert.equal(packA.version, 2);
assert.deepEqual(Array.from(packA.vertices), Array.from(packB.vertices));
assert.deepEqual(Array.from(packA.indices), Array.from(packB.indices));
assert.equal(packA.provinces.length, 2);
assert.equal(packA.provinces[0].provinceId, "alpha");
assert.equal(packA.provinces[1].provinceId, "beta");
assert.equal(packA.indices.length % 3, 0);
assert.ok(packA.vertices.length > 0);
assert.ok(packA.tiles.length >= 2);

for (const province of packA.provinces) {
  for (const range of province.lodRanges) {
    assert.equal(range.indexCount % 3, 0);
    assert.ok(range.firstIndex + range.indexCount <= packA.indices.length);
  }
}
for (const index of packA.indices) assert.ok(index < packA.vertices.length / 2);

const metadata = createProvinceMetaBufferData(packA);
assert.equal(metadata.byteLength, packA.provinces.length * PROVINCE_META_BYTES);
const commands = createIndirectCommandBuffer(packA.provinces.length);
writeIndirectCommand(commands, 0, { indexCount: packA.provinces[0].lodRanges[0].indexCount, firstIndex: packA.provinces[0].lodRanges[0].firstIndex });
assert.equal(validateIndirectCommand(commands.slice(0, 20), packA.indices.length), true);

console.log("GPU province pack v2 tests passed: deterministic indexed geometry, LOD ranges, tiles and indirect command invariants.");
