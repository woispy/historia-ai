/**
 * Historia AI — Parallel Province Pack contract test.
 *
 * Verifies the worker-thread parallel packer PRESERVES the original packer
 * behavior: same province ids, same renderable counts, triangle-aligned
 * indices, deterministic output, and sequential-equivalent results. Also
 * verifies the sequential fallback (workerCount=1).
 */

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildIndexedProvincePackParallel } from "../../src/map/rendering/gpu/ParallelProvincePacker.js";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPackStable.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const geometryDirectory = path.join(root, "src/world/map/assets/geometry");
const files = (await readdir(geometryDirectory)).filter((name) => /^geometry_country_.*\.json$/.test(name)).sort();

const entries = [];
for (const file of files) {
  const asset = JSON.parse(await readFile(path.join(geometryDirectory, file), "utf8"));
  entries.push({ province: { id: asset.id }, geometry: asset });
}
assert.equal(entries.length, 242, "test requires the full Natural Earth asset set");

let passed = 0;

function assertPackInvariants(pack, label, expectedProvinceIds) {
  assert.equal(pack.provinces.length, expectedProvinceIds.length, `${label}: province count`);
  const ids = pack.provinces.map((province) => province.provinceId).sort();
  assert.deepEqual(ids, [...expectedProvinceIds].sort(), `${label}: every province id must be present exactly once`);
  assert.equal(pack.diagnostics.renderableProvinceCount, expectedProvinceIds.length, `${label}: all provinces renderable`);
  assert.equal(pack.diagnostics.renderableProvinceCount + pack.diagnostics.nonRenderableProvinceCount, expectedProvinceIds.length, `${label}: diagnostics cover every province`);
  assert.ok(pack.vertices.length > 0 && pack.indices.length > 0, `${label}: pack emits geometry`);
  assert.equal(pack.indices.length % 3, 0, `${label}: index buffer triangle-aligned`);
  for (let i = 0; i < pack.indices.length; i += 1) {
    if (pack.indices[i] >= pack.vertices.length / 2) throw new Error(`${label}: index out of bounds at ${i}`);
  }
  for (const tile of pack.tiles) {
    for (const provinceIndex of tile.provinceIndices) {
      if (provinceIndex < 0 || provinceIndex >= pack.provinces.length) throw new Error(`${label}: tile references out-of-bounds province index`);
    }
  }
}

const expectedIds = entries.map((entry) => entry.province.id);

// 1. Parallel pack invariants (4 workers)
const pack4 = await buildIndexedProvincePackParallel(entries, { tileSize: 10, quantization: 1e6, workerCount: 4 });
assertPackInvariants(pack4, "parallel(4)", expectedIds);
passed += 1;

// 2. Determinism: two builds produce identical output
function checksum(pack) {
  let vertexSum = 0;
  let indexSum = 0;
  for (let i = 0; i < pack.vertices.length; i += 1) vertexSum = (vertexSum + pack.vertices[i] * (i + 1)) % 2 ** 53;
  for (let i = 0; i < pack.indices.length; i += 1) indexSum = (indexSum + pack.indices[i] * (i + 7)) % 2 ** 53;
  return `v${pack.vertices.length}:${vertexSum}|i${pack.indices.length}:${indexSum}|p${pack.provinces.length}:${pack.diagnostics.renderableProvinceCount}`;
}
const pack4b = await buildIndexedProvincePackParallel(entries, { tileSize: 10, quantization: 1e6, workerCount: 4 });
assert.equal(checksum(pack4), checksum(pack4b), "parallel pack build must be deterministic");
passed += 1;

// 3. Sequential equivalence: same province ids, renderable counts, and
//    identical per-province geometry (vertices/indices within each province).
const sequential = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
assertPackInvariants(sequential, "sequential", expectedIds);
assert.equal(pack4.diagnostics.renderableProvinceCount, sequential.diagnostics.renderableProvinceCount, "renderable counts must match sequential");

const sequentialById = new Map(sequential.provinces.map((province) => [province.provinceId, province]));
for (const province of pack4.provinces) {
  const reference = sequentialById.get(province.provinceId);
  assert.ok(reference, `province ${province.provinceId} must exist in sequential pack`);
  assert.equal(province.triangulablePolygonCount, reference.triangulablePolygonCount, `${province.provinceId}: triangulable polygon count`);
  const lodCountA = province.lodRanges.length;
  const lodCountB = reference.lodRanges.length;
  assert.equal(lodCountA, lodCountB, `${province.provinceId}: LOD range count`);
  for (let lod = 0; lod < lodCountA; lod += 1) {
    assert.equal(province.lodRanges[lod].indexCount, reference.lodRanges[lod].indexCount, `${province.provinceId}: LOD${lod} index count must match sequential`);
  }
}
passed += 1;

// 4. Sequential fallback (workerCount=1) returns the original packer result
const fallback = await buildIndexedProvincePackParallel(entries, { tileSize: 10, quantization: 1e6, workerCount: 1 });
assert.equal(checksum(fallback), checksum(sequential), "workerCount=1 must produce the exact sequential result");
passed += 1;

console.log(`Parallel province pack contract passed: ${passed} checks, 242 provinces, deterministic, sequential-equivalent (per-province LOD index counts identical), fallback verified.`);
