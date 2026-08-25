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
assert.equal(runtime.provinces.length, ANATOLIA_PROVINCE_METADATA.length);
assert.equal(runtime.provincePoliticalStates.length, runtime.provinces.length);
assert.ok(runtime.provinces.length >= 44, "the historical Anatolia mesh should be materially finer than the original 38-province pass");
assert.equal(
  runtime.polities.every((polity) => getHistoricalPolityIds().includes(polity.id)),
  true,
);

const provinceById = new Map(runtime.provinces.map((province) => [province.id, province]));
const politicalStateByProvinceId = new Map(
  runtime.provincePoliticalStates.map((state) => [state.provinceId, state]),
);

for (const province of runtime.provinces) {
  assert.equal(province.type, "province");
  assert.equal(province.timeModel, "historical");
  assert.equal(province.sourceType, "historical-runtime");
  assert.ok(province.cityId);
  assert.ok(Array.isArray(province.centroid));
  assert.notEqual(province.id, province.cityId, `${province.id} must remain distinct from its city anchor`);
  assert.equal(typeof province.coastal, "boolean");
  assert.equal(typeof province.port, "boolean");
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
assert.equal(provinceById.get("phrygia-denizli").polityId, "inanc");
assert.equal(provinceById.get("phrygia-uluborlu").polityId, "hamid");
assert.equal(provinceById.get("pisidia-egirdir").polityId, "hamid");
assert.equal(provinceById.get("phrygia-afyon").polityId, "sahibata");
assert.equal(provinceById.get("lycaonia-konya").polityId, "karaman");
assert.equal(provinceById.get("cappadocia-nigde").polityId, "karaman");
assert.equal(provinceById.get("pontus-sinop").polityId, "pervane");
assert.equal(provinceById.get("pontus-kastamon").polityId, "cobanid");
assert.equal(provinceById.get("pontus-trebizond").polityId, "trebizond");
assert.equal(provinceById.get("cilicia-sis").polityId, "cilicia");
assert.equal(provinceById.get("cilicia-adana").polityId, "cilicia");
assert.equal(provinceById.get("ionia-ayasuluk").polityId, "byzantium");
assert.equal(provinceById.get("lydia-birgi").polityId, "byzantium");

// Ilkhanid suzerainty is layered above local/direct political control;
// it must not be encoded as direct province ownership.
assert.equal(provinceById.get("euphrates-malatya").polityId, null);
assert.equal(provinceById.get("euphrates-malatya").suzerainPolityId, "ilkhanate");

assert.equal(provinceById.get("bithynia-nicomedia").coastal, true);
assert.equal(provinceById.get("pontus-sinop").coastal, true);
assert.equal(provinceById.get("lydia-magnesia").coastal, false);
assert.equal(provinceById.get("bithynia-nicomedia").port, true);
assert.equal(provinceById.get("pamphylia-attaleia").coastal, true);
assert.equal(provinceById.get("pamphylia-attaleia").port, true);

assert.equal(politicalStateByProvinceId.get("ionia-ayasuluk").controlStatus, "Byzantine-coastal-before-1304");
assert.equal(politicalStateByProvinceId.get("phrygia-denizli").controlConfidence, "high");
assert.equal(politicalStateByProvinceId.get("phrygia-afyon").controlStatus, "established-local-beylik");
assert.equal(politicalStateByProvinceId.get("pontus-kastamon").controlStatus, "Cobanoid-local-rule");
assert.equal(politicalStateByProvinceId.get("phrygia-eskisehir").sovereignPolityId, null);
assert.equal(politicalStateByProvinceId.get("cappadocia-kayseri").suzeraintyPolityId, "ilkhanate");
assert.equal(politicalStateByProvinceId.get("euphrates-malatya").suzeraintyPolityId, "ilkhanate");

assert.equal(getHistoricalPolity("inanc").type, "polity");
assert.equal(getHistoricalPolity("hamid").type, "polity");
assert.equal(getHistoricalPolity("sahibata").type, "polity");
assert.equal(getHistoricalPolity("cobanid").type, "polity");
assert.equal(getHistoricalPolity("ilkhanate").kind, "suzerain");
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
  + `${runtime.polities.length} direct historical polities, layered suzerainty preserved, Admin-0 firewall active.`,
);
