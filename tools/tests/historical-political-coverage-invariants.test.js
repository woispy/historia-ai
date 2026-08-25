import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { createHistoricalPoliticalRuntime } from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";

const HISTORICAL_1300_DATE = "1300-01-01";

const phase2D = buildAnatoliaPhase2DAssets([]);

assert.equal(ANATOLIA_PROVINCE_METADATA.length, 38);
assert.equal(phase2D.provinceCount, 38);
assert.equal(phase2D.provinces.length, 38);
assert.equal(phase2D.geometries.length, 38);
assert.equal(phase2D.provinces.length, phase2D.geometries.length);

const metadataIds = new Set(ANATOLIA_PROVINCE_METADATA.map((province) => province.id));
const provinceIds = new Set(phase2D.provinces.map((province) => province.identity.id));
const geometryIds = new Set(phase2D.geometries.map((geometry) => geometry.identity.id));

assert.deepEqual([...provinceIds].sort(), [...metadataIds].sort());
assert.deepEqual([...geometryIds].sort(), [...metadataIds].sort());

for (const geometry of phase2D.geometries) {
  assert.equal(geometry.identity.provinceId, geometry.identity.id);
  assert.ok(Array.isArray(geometry.polygons) && geometry.polygons.length > 0);
  assert.ok(geometry.polygons.every((polygon) => Array.isArray(polygon) && polygon.length >= 3));
}

const runtime = createHistoricalPoliticalRuntime({
  date: HISTORICAL_1300_DATE,
  provinceMetadata: ANATOLIA_PROVINCE_METADATA,
});

assert.equal(runtime.provinces.length, 38);
assert.ok(runtime.provinces.every((province) => province.timeModel === "historical"));
assert.ok(runtime.provinces.every((province) => province.sourceType === "historical-runtime"));

const controlledCount = runtime.provinces.filter((province) => province.polityId).length;
assert.ok(controlledCount > 0, "1300 historical runtime must contain controlled Anatolia provinces");

console.log(
  `Historical political coverage invariants passed: ${phase2D.provinceCount} curated Anatolia province geometries, `
  + `${controlledCount} controlled 1300 identities, province↔geometry IDs synchronized.`,
);
