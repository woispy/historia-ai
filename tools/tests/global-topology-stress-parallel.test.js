/**
 * Historia AI — Global Topology Stress (Parallel)
 *
 * Runs the same 3 scaling levels as global-topology-stress.test.js through
 * the worker-thread parallel packer. Asserts the same structural invariants
 * (province count, renderable coverage, triangle alignment, determinism)
 * and reports per-level timing against the sequential baseline.
 *
 * Sequential baseline (original packer): 2x2 ~20s, 4x4 ~81s, 16x16 ~245s.
 */

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cpus } from "node:os";
import { buildIndexedProvincePackParallel } from "../../src/map/rendering/gpu/ParallelProvincePacker.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const geometryDirectory = path.join(root, "src/world/map/assets/geometry");
const files = (await readdir(geometryDirectory)).filter((name) => /^geometry_country_.*\.json$/.test(name)).sort();

const entries = [];
for (const file of files) {
  const asset = JSON.parse(await readFile(path.join(geometryDirectory, file), "utf8"));
  entries.push({ province: { id: asset.id }, geometry: asset });
}
assert.equal(entries.length, 242, "stress test requires the full Natural Earth asset set");

function replicateEntries(copiesPerAxis, assetStride = 1) {
  const selected = entries.filter((_, index) => index % assetStride === 0);
  const replicated = [];
  const half = (copiesPerAxis - 1) / 2;
  for (let row = 0; row < copiesPerAxis; row += 1) {
    for (let column = 0; column < copiesPerAxis; column += 1) {
      const offsetX = (column - half) * 40;
      const offsetY = (row - half) * 24;
      for (let index = 0; index < selected.length; index += 1) {
        const entry = selected[index];
        replicated.push({
          province: { id: `${entry.province.id}_r${row}c${column}` },
          geometry: {
            ...entry.geometry,
            polygons: entry.geometry.polygons.map((polygon) => polygon.map(([x, y]) => [x + offsetX, y + offsetY])),
          },
        });
      }
    }
  }
  return replicated;
}

function checksum(pack) {
  let vertexSum = 0;
  let indexSum = 0;
  for (let i = 0; i < pack.vertices.length; i += 1) vertexSum = (vertexSum + pack.vertices[i] * (i + 1)) % 2 ** 53;
  for (let i = 0; i < pack.indices.length; i += 1) indexSum = (indexSum + pack.indices[i] * (i + 7)) % 2 ** 53;
  return `v${pack.vertices.length}:${vertexSum}|i${pack.indices.length}:${indexSum}|p${pack.provinces.length}:${pack.diagnostics.renderableProvinceCount}`;
}

function assertPackInvariants(pack, label, provinceCount) {
  assert.equal(pack.provinces.length, provinceCount, `${label}: every synthetic province must be packed`);
  assert.equal(pack.diagnostics.renderableProvinceCount + pack.diagnostics.nonRenderableProvinceCount, provinceCount, `${label}: diagnostics must cover every province`);
  assert.equal(pack.diagnostics.renderableProvinceCount, provinceCount, `${label}: translated Natural Earth rings must remain renderable`);
  assert.ok(pack.vertices.length > 0 && pack.indices.length > 0, `${label}: pack must emit geometry`);
  assert.equal(pack.indices.length % 3, 0, `${label}: index buffer must stay triangle-aligned`);
}

const workerCount = Math.max(2, cpus().length - 1);
const LEVELS = [
  { copiesPerAxis: 2, assetStride: 1, deterministic: true },
  { copiesPerAxis: 4, assetStride: 1, deterministic: false },
  { copiesPerAxis: 16, assetStride: 4, deterministic: false },
];
let previousChecksum = null;

for (const level of LEVELS) {
  const provinceCount = Math.ceil(entries.length / level.assetStride) * level.copiesPerAxis * level.copiesPerAxis;
  const started = performance.now();
  const pack = await buildIndexedProvincePackParallel(replicateEntries(level.copiesPerAxis, level.assetStride), { tileSize: 10, quantization: 1e6, workerCount });
  const elapsed = Math.round(performance.now() - started);

  assertPackInvariants(pack, `level ${level.copiesPerAxis}x${level.copiesPerAxis}`, provinceCount);
  if (level.deterministic) {
    const packB = await buildIndexedProvincePackParallel(replicateEntries(level.copiesPerAxis, level.assetStride), { tileSize: 10, quantization: 1e6, workerCount });
    assert.equal(checksum(pack), checksum(packB), `level ${level.copiesPerAxis}x${level.copiesPerAxis}: parallel pack build must be deterministic`);
  }
  if (previousChecksum !== null) assert.notEqual(checksum(pack), previousChecksum, `level ${level.copiesPerAxis}: stress level must change geometry scale`);
  previousChecksum = checksum(pack);

  console.log(`Parallel stress ${level.copiesPerAxis}x${level.copiesPerAxis}: ${provinceCount} provinces, ${pack.vertices.length / 2} packed vertices, ${pack.indices.length} indices, renderable=${pack.diagnostics.renderableProvinceCount}${level.deterministic ? ", deterministic" : ""}, ${elapsed}ms (workers=${workerCount}).`);
}

console.log("Global topology stress (parallel) passed: 3 levels up to 15K+ province scale via worker-thread parallel packer.");
