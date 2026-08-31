import assert from "node:assert/strict";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";
import { COMPUTE_CULL_SHADER, createProvinceMetaBufferData, createIndirectCommandBuffer, PROVINCE_META_BYTES, INDIRECT_COMMAND_BYTES } from "../../src/map/rendering/gpu/WebGPUProvincePipeline.js";

const entries = Array.from({ length: 64 }, (_, i) => ({
  province: { id: `p-${String(i).padStart(3, "0")}` },
  geometry: { polygons: [[[i, 0], [i + 0.8, 0], [i + 0.8, 0.8], [i, 0.8]]] },
}));
const pack = buildIndexedProvincePack(entries, { tileSize: 4 });
assert.equal(pack.version, 2);
assert.equal(pack.provinces.length, 64);
assert.equal(pack.indices.length % 3, 0);
assert.ok(pack.tiles.length > 1);
assert.ok(pack.provinces.every((p) => p.lodRanges.length === 4));
assert.ok(pack.provinces.every((p) => p.lodRanges.every((r) => r.firstIndex + r.indexCount <= pack.indices.length)));
assert.ok(pack.provinces.every((p) => p.lodRanges.every((r) => r.indexCount % 3 === 0)));
assert.equal(createProvinceMetaBufferData(pack).byteLength, 64 * PROVINCE_META_BYTES);
assert.equal(createIndirectCommandBuffer(64).byteLength, 64 * INDIRECT_COMMAND_BYTES);
assert.match(COMPUTE_CULL_SHADER, /@compute/);
assert.match(COMPUTE_CULL_SHADER, /storage/);
assert.match(COMPUTE_CULL_SHADER, /arrayLength/);
assert.match(COMPUTE_CULL_SHADER, /firstIndex/);
console.log("GPU-native geometry contract passed: indexed pack, tiles, four LOD ranges and WebGPU compute command layout.");
