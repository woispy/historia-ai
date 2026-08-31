import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeHistoricalRuntimeRegion } from "../../src/world/map/binary/HistoricalRuntimeBinary.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimeDir = path.join(root, "src/world/map/assets/historical/1300");
const manifestPath = path.join(runtimeDir, "manifest.json");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
assert.equal(manifest.assetType, "historical-runtime-manifest");
assert.equal(manifest.historicalDate, "1300-01-01");
assert.equal(manifest.schemaVersion, 2);
assert.equal(manifest.dataPlane?.format, "hmap");
assert.equal(manifest.dataPlane?.version, 1);
assert.ok(Array.isArray(manifest.regions));
assert.ok(manifest.regions.length >= 2, "Historical runtime must be split into multiple regions");
assert.equal(manifest.counts.provinces, manifest.counts.geometries);

const provinceIds = new Set();
const geometryIds = new Set();
let provinceCount = 0;
let geometryCount = 0;
let polygonCount = 0;

for (const region of manifest.regions) {
  assert.match(region.id, /^[a-z0-9-]+$/);
  assert.match(region.file, /^regions\/[a-z0-9-]+\.bin$/);
  assert.ok(region.byteLength > 52, `Binary region ${region.id} must contain a valid header and payload.`);

  const bytes = new Uint8Array(await fs.readFile(path.join(runtimeDir, region.file)));
  const regionAsset = decodeHistoricalRuntimeRegion(bytes, {
    source: manifest.source,
  });

  assert.equal(regionAsset.assetType, "historical-runtime-region");
  assert.equal(regionAsset.regionId, region.id);
  assert.equal(regionAsset.historicalDate, "1300-01-01");
  assert.deepEqual(regionAsset.source, manifest.source);
  assert.equal(regionAsset.counts.provinces, region.provinceCount);
  assert.equal(regionAsset.counts.geometries, region.geometryCount);
  assert.equal(regionAsset.counts.polygons, region.polygonCount);
  assert.equal(regionAsset.provinces.length, regionAsset.geometries.length);
  assert.equal(bytes.byteLength, region.byteLength);

  for (const province of regionAsset.provinces) {
    assert.ok(province?.identity?.id, `Missing province identity in ${region.id}`);
    assert.ok(!provinceIds.has(province.identity.id), `Duplicate province ${province.identity.id}`);
    provinceIds.add(province.identity.id);
    provinceCount += 1;
  }

  for (const geometry of regionAsset.geometries) {
    assert.ok(geometry?.identity?.id, `Missing geometry identity in ${region.id}`);
    assert.ok(!geometryIds.has(geometry.identity.id), `Duplicate geometry ${geometry.identity.id}`);
    assert.ok(provinceIds.has(geometry.identity.id), `Geometry has no province asset: ${geometry.identity.id}`);
    geometryIds.add(geometry.identity.id);
    geometryCount += 1;
    polygonCount += geometry.polygons.length;
  }
}

assert.equal(provinceCount, manifest.counts.provinces);
assert.equal(geometryCount, manifest.counts.geometries);
assert.equal(polygonCount, manifest.counts.polygons);
assert.deepEqual([...provinceIds].sort(), [...geometryIds].sort());

const loader = await import("../../src/world/map/loader/HistoricalRuntimeManifestLoader.js");
const selectedRegion = manifest.regions[0];
const selectedRuntime = await loader.loadHistoricalRuntimeRegions("1300", selectedRegion.id);
assert.deepEqual(selectedRuntime.loadedRegions, [selectedRegion.id]);
assert.equal(selectedRuntime.counts.provinces, selectedRegion.provinceCount);
assert.equal(selectedRuntime.counts.geometries, selectedRegion.geometryCount);
assert.deepEqual(selectedRuntime.source, manifest.source);

const mergedRuntime = await loader.loadHistoricalRuntimeAsset("1300");
assert.equal(mergedRuntime.counts.provinces, manifest.counts.provinces);
assert.equal(mergedRuntime.counts.geometries, manifest.counts.geometries);
assert.deepEqual(
  [...mergedRuntime.provinces].map((province) => province.identity.id).sort(),
  [...provinceIds].sort(),
);

await assert.rejects(
  () => loader.loadHistoricalRuntimeRegions("1300", "missing-region"),
  /Historical runtime regions are missing/,
);

loader.clearHistoricalRuntimeCache();

console.log(
  `historical-runtime-regions.test.js: ${manifest.regions.length} binary regions, ${provinceCount} provinces, ${geometryCount} geometries and selective loading validated`,
);
