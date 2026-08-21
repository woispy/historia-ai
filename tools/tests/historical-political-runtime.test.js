import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  createHistoricalPoliticalRuntime,
  getHistoricalPolity,
  getHistoricalPolityIds,
} from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";

const runtime = createHistoricalPoliticalRuntime({
  date: "1300-01-01",
  provinceMetadata: ANATOLIA_PROVINCE_METADATA,
});

assert.equal(runtime.date, "1300-01-01");
assert.equal(runtime.provinces.length, 38);
assert.equal(runtime.polities.length, 12);
assert.deepEqual(new Set(getHistoricalPolityIds()), new Set(runtime.polities.map((polity) => polity.id)));

const provinceById = new Map(runtime.provinces.map((province) => [province.id, province]));

for (const province of runtime.provinces) {
  assert.equal(province.type, "province");
  assert.equal(province.timeModel, "historical");
  assert.equal(province.sourceType, "historical-runtime");
  assert.ok(province.cityId);
  assert.ok(Array.isArray(province.centroid));
  assert.notEqual(province.id, province.cityId, `${province.id} must remain distinct from its city anchor`);
}

assert.equal(provinceById.get("bithynia-nicomedia").polityId, "byzantium");
assert.equal(provinceById.get("bithynia-nicaea").polityId, "byzantium");
assert.equal(provinceById.get("bithynia-prusa").polityId, "byzantium");
assert.equal(provinceById.get("phrygia-sogut").polityId, "ottomans");
assert.equal(provinceById.get("mysia-balikesir").polityId, "karasi");
assert.equal(provinceById.get("lydia-magnesia").polityId, "saruhan");
assert.equal(provinceById.get("caria-mylasa").polityId, "mentese");
assert.equal(provinceById.get("pisidia-beysehir").polityId, "esref");
assert.equal(provinceById.get("phrygia-kutahya").polityId, "germiyan");
assert.equal(provinceById.get("lycaonia-konya").polityId, "karaman");
assert.equal(provinceById.get("pontus-sinop").polityId, "pervane");
assert.equal(provinceById.get("pontus-kastamon").polityId, "candar");
assert.equal(provinceById.get("pontus-trebizond").polityId, "trebizond");
assert.equal(provinceById.get("cilicia-sis").polityId, "cilicia");

for (const provinceId of ["ionia-ayasuluk", "lydia-birgi", "phrygia-uluborlu", "pisidia-egirdir"]) {
  assert.equal(provinceById.get(provinceId).polityId, null);
}

assert.equal(getHistoricalPolity("byzantium").type, "polity");
assert.equal(getHistoricalPolity("byzantium").timeModel, "historical");
assert.equal(getHistoricalPolity("trebizond").sourceType, "historical-runtime");
assert.equal(getHistoricalPolity("cilicia").sourceType, "historical-runtime");
assert.equal(getHistoricalPolity("turkey"), null);
assert.equal(getHistoricalPolity("türkiye"), null);

assert.throws(
  () => createHistoricalPoliticalRuntime({
    date: "1300-01-01",
    provinceMetadata: [{ id: "modern-turkey", type: "province", sourceType: "modern-admin0" }],
  }),
  /Modern Admin-0 identity cannot enter historical province runtime/,
);

console.log(
  `Historical political runtime tests passed: ${runtime.provinces.length} provinces, `
  + `${runtime.polities.length} historical polities, Admin-0 firewall active.`,
);
