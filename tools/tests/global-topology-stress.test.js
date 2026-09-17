/**
 * Historia AI — Global topology stress contract.
 *
 * The 15K+ province scaling target is dominated by province count, not by
 * ring size. This test therefore packs translated synthetic copies of the
 * 242 Natural Earth country assets (translation preserves ring simplicity)
 * to simulate 1K/15K-scale province loads, and rebuilds the indexed GPU
 * province pack at each stress level. Asserts structural invariants and
 * deterministic output. Stress geometry is synthetic and is never political
 * geography authority.
 */

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const geometryDirectory = path.join(root, "src/world/map/assets/geometry");
const files = (await readdir(geometryDirectory)).filter((name) => /^geometry_country_.*\.json$/.test(name)).sort();

const entries = [];
for (const file of files) {
  const asset = JSON.parse(await readFile(path.join(geometryDirectory, file), "utf8"));
  entries.push({ province: { id: asset.id }, geometry: asset });
}
assert.equal(entries.length, 242, "stress test requires the full Natural Earth asset set");

// Pure translation keeps every ring simple and renderable; the offsets are
// unique per copy so no qkey collisions occur between copies. assetStride
// subsamples the asset set for the largest level so the 15K-scale run stays
// within a test-sized runtime budget.
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
  const vertices = Number(pack.vertices.length);
  const indices = Number(pack.indices.length);
  let vertexSum = 0;
  let indexSum = 0;
  for (let i = 0; i < pack.vertices.length; i += 1) vertexSum = (vertexSum + pack.vertices[i] * (i + 1)) % 2 ** 53;
  for (let i = 0; i < pack.indices.length; i += 1) indexSum = (indexSum + pack.indices[i] * (i + 7)) % 2 ** 53;
  return `v${vertices}:${vertexSum}|i${indices}:${indexSum}|p${pack.provinces.length}:${pack.diagnostics.renderableProvinceCount}`;
}

function assertPackInvariants(pack, label, provinceCount) {
  assert.equal(pack.provinces.length, provinceCount, `${label}: every synthetic province must be packed`);
  assert.equal(pack.diagnostics.renderableProvinceCount + pack.diagnostics.nonRenderableProvinceCount, provinceCount, `${label}: diagnostics must cover every province`);
  assert.equal(pack.diagnostics.renderableProvinceCount, provinceCount, `${label}: translated Natural Earth rings must remain renderable`);
  assert.ok(pack.vertices.length > 0 && pack.indices.length > 0, `${label}: pack must emit geometry`);
  assert.equal(pack.indices.length % 3, 0, `${label}: index buffer must stay triangle-aligned`);
  assert.ok(pack.tiles.length > 0, `${label}: pack must emit tile coverage`);
}

const LEVELS = [
  { copiesPerAxis: 2, assetStride: 1, deterministic: true },
  { copiesPerAxis: 4, assetStride: 1, deterministic: false },
  { copiesPerAxis: 16, assetStride: 4, deterministic: false },
];
let previousChecksum = null;

for (const level of LEVELS) {
  const provinceCount = Math.ceil(entries.length / level.assetStride) * level.copiesPerAxis * level.copiesPerAxis;
  const started = performance.now();
  const packA = buildIndexedProvincePack(replicateEntries(level.copiesPerAxis, level.assetStride), { tileSize: 10, quantization: 1e6 });
  const elapsed = Math.round(performance.now() - started);

  assertPackInvariants(packA, `level ${level.copiesPerAxis}x${level.copiesPerAxis}`, provinceCount);
  if (level.deterministic) {
    const packB = buildIndexedProvincePack(replicateEntries(level.copiesPerAxis, level.assetStride), { tileSize: 10, quantization: 1e6 });
    assert.equal(checksum(packA), checksum(packB), `level ${level.copiesPerAxis}x${level.copiesPerAxis}: pack build must be deterministic`);
  }
  if (previousChecksum !== null) assert.notEqual(checksum(packA), previousChecksum, `level ${level.copiesPerAxis}: stress level must change geometry scale`);
  previousChecksum = checksum(packA);

  console.log(`Stress level ${level.copiesPerAxis}x${level.copiesPerAxis}: ${provinceCount} provinces, ${packA.vertices.length / 2} packed vertices, ${packA.indices.length} indices, ${packA.tiles.length} tiles, renderable=${packA.diagnostics.renderableProvinceCount}${level.deterministic ? ", deterministic" : ""}, ${elapsed}ms.`);
}

console.log("Global topology stress passed: 3 levels up to 15K+ province scale, renderable packs, triangle-aligned indices, deterministic where checked.");
