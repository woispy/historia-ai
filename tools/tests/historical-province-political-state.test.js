import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalRuntime } from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";
import { createHistoricalProvincePoliticalStates } from "../../src/world/map/historical/HistoricalProvincePoliticalState.js";

const date = "1300-01-01";
const runtime = createHistoricalPoliticalRuntime({
  date,
  provinceMetadata: ANATOLIA_PROVINCE_METADATA,
});
const states = createHistoricalProvincePoliticalStates({
  date,
  provinces: runtime.provinces,
});

assert.equal(states.length, runtime.provinces.length);
assert.equal(runtime.provincePoliticalStates.length, runtime.provinces.length);
assert.equal(states.every((state) => state.date === date), true);
assert.equal(states.every((state) => state.sourceType === "historical-runtime"), true);

const byProvince = new Map(states.map((state) => [state.provinceId, state]));

assert.equal(byProvince.get("bithynia-nicaea").sovereignPolityId, "byzantium");
assert.equal(byProvince.get("phrygia-sogut").sovereignPolityId, "ottomans");
assert.equal(byProvince.get("phrygia-kutahya").sovereignPolityId, "germiyan");
assert.equal(byProvince.get("phrygia-denizli").sovereignPolityId, "inanc");
assert.equal(byProvince.get("phrygia-uluborlu").sovereignPolityId, "hamid");
assert.equal(byProvince.get("pisidia-egirdir").sovereignPolityId, "hamid");
assert.equal(byProvince.get("phrygia-afyon").sovereignPolityId, "sahibata");
assert.equal(byProvince.get("pontus-sinop").sovereignPolityId, "pervane");
assert.equal(byProvince.get("pontus-trebizond").sovereignPolityId, "trebizond");
assert.equal(byProvince.get("cilicia-sis").sovereignPolityId, "cilicia");
assert.equal(byProvince.get("ionia-ayasuluk").sovereignPolityId, "byzantium");
assert.equal(byProvince.get("lydia-birgi").sovereignPolityId, "byzantium");
assert.equal(byProvince.get("cappadocia-kayseri").sovereignPolityId, null);
assert.equal(byProvince.get("cappadocia-kayseri").suzeraintyPolityId, "ilkhanate");
assert.equal(byProvince.get("cappadocia-kayseri").controlMode, "layered-suzerainty");
assert.equal(byProvince.get("galatia-ankara").controlMode, "layered-suzerainty");
assert.equal(byProvince.get("phrygia-eskisehir").controlMode, "contested-frontier");

assert.throws(
  () => createHistoricalProvincePoliticalStates({ date: "1300", provinces: runtime.provinces }),
  /ISO date/,
);

console.log(
  `Historical province political state tests passed: ${states.length} dated provinces, `
  + `${states.filter((state) => state.sovereignPolityId).length} sovereign controls, `
  + `${states.filter((state) => state.suzeraintyPolityId).length} layered suzerainties.`,
);
