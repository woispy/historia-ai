import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";
import { createProvinceMetaBufferData, createIndirectCommandBuffer, PROVINCE_META_BYTES, INDIRECT_COMMAND_BYTES } from "../../src/map/rendering/gpu/WebGPUProvincePipeline.js";

const COUNT = 15000;
const entries = Array.from({ length: COUNT }, (_, i) => {
  const x = (i % 300) * 1.05;
  const y = Math.floor(i / 300) * 1.05;
  return {
    province: { id: `stress-${i}` },
    geometry: { polygons: [[[x, y], [x + 0.9, y], [x + 0.9, y + 0.9], [x, y + 0.9]]] },
  };
});

const started = performance.now();
const pack = buildIndexedProvincePack(entries, { tileSize: 10 });
const elapsedMs = performance.now() - started;

assert.equal(pack.version, 2);
assert.equal(pack.provinces.length, COUNT);
assert.equal(pack.indices.length % 3, 0);
assert.equal(pack.provinces.length * PROVINCE_META_BYTES, createProvinceMetaBufferData(pack).byteLength);
assert.equal(COUNT * INDIRECT_COMMAND_BYTES, createIndirectCommandBuffer(COUNT).byteLength);
assert.ok(pack.tiles.length > 100);
assert.ok(pack.provinces.every((province) => province.lodRanges.length === 4));
assert.ok(pack.provinces.every((province) => province.lodRanges.every((range) => range.indexCount % 3 === 0)));
assert.ok(pack.provinces.every((province) => province.lodRanges.every((range) => range.firstIndex + range.indexCount <= pack.indices.length)));

const verticesBytes = pack.vertices.byteLength;
const indicesBytes = pack.indices.byteLength;
const metadataBytes = createProvinceMetaBufferData(pack).byteLength;
const indirectBytes = createIndirectCommandBuffer(COUNT).byteLength;
console.log(`15,000 province GPU pack stress passed: ${COUNT} provinces, ${pack.tiles.length} tiles, ${pack.indices.length / 3} triangles, ${(verticesBytes + indicesBytes + metadataBytes + indirectBytes) / (1024 * 1024) | 0} MiB packed buffers, ${elapsedMs.toFixed(1)} ms build.`);
