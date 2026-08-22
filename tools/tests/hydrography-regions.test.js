import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("src/map/data/generated/anatolia-hydrography-10m.json");
const regionRoot = path.resolve("public/assets/hydrography-regions");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const manifest = JSON.parse(await readFile(path.join(regionRoot, "manifest.json"), "utf8"));

assert.ok(manifest.regions.length > 0, "Hydrography manifest must contain regions.");
assert.equal(manifest.projection, source.projection);

const files = new Set(await readdir(regionRoot));
const rivers = new Map();
const lakes = new Map();

for (const region of manifest.regions) {
  assert.ok(files.has(`${region.id}.json`), `${region.id} asset must exist.`);
  const asset = JSON.parse(await readFile(path.join(regionRoot, `${region.id}.json`), "utf8"));
  assert.equal(asset.id, region.id);
  assert.deepEqual(asset.bounds, region.bounds);

  assert.equal(asset.rivers.length, region.riverCount, `${region.id} river count must match manifest.`);
  assert.equal(asset.lakes.length, region.lakeCount, `${region.id} lake count must match manifest.`);

  for (const river of asset.rivers) {
    assert.ok(Array.isArray(river.bounds) && river.bounds.length === 4, `${river.id} must retain bounds.`);
    assert.ok(Array.isArray(river.coordinates) && river.coordinates.length >= 2, `${river.id} must retain geometry.`);
    rivers.set(river.id, river);
  }
  for (const lake of asset.lakes) {
    assert.ok(Array.isArray(lake.bounds) && lake.bounds.length === 4, `${lake.id} must retain bounds.`);
    assert.ok(Array.isArray(lake.rings) && lake.rings.length > 0, `${lake.id} must retain polygon geometry.`);
    lakes.set(lake.id, lake);
  }
}

assert.deepEqual([...rivers.keys()].sort(), source.rivers.map((feature) => feature.id).sort(), "Regional river union must equal authoritative river IDs.");
assert.deepEqual([...lakes.keys()].sort(), source.lakes.map((feature) => feature.id).sort(), "Regional lake union must equal authoritative lake IDs.");

console.log(`Hydrography regional parity passed: ${manifest.regions.length} regions, ${rivers.size} unique rivers, ${lakes.size} unique lakes.`);
