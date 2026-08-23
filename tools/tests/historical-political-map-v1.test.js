import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { createHistoricalPoliticalMapModel } from "../../src/world/map/historical/HistoricalPoliticalMapModel.js";
import { createHistoricalPoliticalPresentation } from "../../src/world/map/historical/HistoricalPoliticalPresentation.js";

const countries = Object.fromEntries([
  ["local_polities", "#777777"], ["byzantium", "#6A1B9A"], ["ottomans", "#0F7A32"],
  ["karasi", "#B87333"], ["saruhan", "#786A9D"], ["mentese", "#3E7C59"],
  ["esref", "#7B6840"], ["germiyan", "#8C5A2B"], ["inanc", "#5E8C61"],
  ["hamid", "#4F8065"], ["sahibata", "#806A4A"], ["karaman", "#A33F3F"],
  ["pervane", "#6B7280"], ["cobanid", "#8A7358"], ["candar", "#7A6A3A"],
  ["trebizond", "#4A7896"], ["cilicia", "#8B4A62"], ["ilkhanate", "#3D73B9"],
].map(([id, color]) => [id, { id, color, timeModel: "historical", sourceType: "historical-runtime" }]));

const repository = { byId: countries };
const sourceProvinces = ANATOLIA_PROVINCE_METADATA.map(({ id, countryId }) => ({ id, owner: countryId }));
const model = createHistoricalPoliticalMapModel({ date: "1300-01-01", provinces: sourceProvinces, countryRepository: repository });

assert.equal(model.length, ANATOLIA_PROVINCE_METADATA.length);
assert.ok(model.length >= 44);

const expected = {
  "bithynia-nicomedia": "byzantium", "phrygia-sogut": "ottomans", "mysia-balikesir": "karasi",
  "lydia-magnesia": "saruhan", "caria-mylasa": "mentese", "pisidia-beysehir": "esref",
  "phrygia-kutahya": "germiyan", "phrygia-denizli": "inanc", "phrygia-uluborlu": "hamid",
  "pisidia-egirdir": "hamid", "phrygia-afyon": "sahibata", "lycaonia-konya": "karaman",
  "cappadocia-nigde": "karaman", "pontus-sinop": "pervane", "pontus-kastamon": "cobanid",
  "pontus-trebizond": "trebizond", "cilicia-sis": "cilicia", "cilicia-adana": "cilicia",
  "ionia-ayasuluk": "byzantium", "lydia-birgi": "byzantium", "euphrates-malatya": "ilkhanate",
};
for (const [provinceId, polityId] of Object.entries(expected)) {
  assert.equal(model.find((entry) => entry.province.id === provinceId)?.country.id, polityId, provinceId);
}

for (const entry of model) {
  assert.equal(entry.country.type, "polity");
  assert.equal(entry.country.timeModel, "historical");
  assert.equal(entry.country.sourceType, "historical-runtime");
  assert.ok(/^#[0-9a-f]{6}$/i.test(entry.country.color));
  const metadata = ANATOLIA_PROVINCE_METADATA.find((province) => province.id === entry.province.id);
  const city = ANATOLIA_CITY_ATLAS[metadata.cityId];
  assert.ok(city, `${entry.province.id} must resolve to a city atlas record`);
  const reverseIds = Array.isArray(city.mapProvinceIds) ? city.mapProvinceIds : [city.mapProvinceId].filter(Boolean);
  assert.ok(reverseIds.includes(entry.province.id), `${metadata.cityId} must point back to its province`);
}

assert.deepEqual(ANATOLIA_CITY_ATLAS.eskisehir.mapProvinceIds, ["bithynia-sangarios", "phrygia-eskisehir"]);
assert.equal(ANATOLIA_CITY_ATLAS.eskisehir.mapProvinceId, "phrygia-eskisehir");

// Only genuinely unresolved 1300 provinces receive neutral presentation.
// Ankara, Kayseri, Sivas, Malatya, Erzincan and Erzurum are layered Ilkhanid-suzerainty cases.
for (const provinceId of ["phrygia-eskisehir", "lydia-smyrna", "pontus-amasya", "pamphylia-attaleia", "lycia-myra", "pisidia-antiochia", "cilicia-alaiye"]) {
  const entry = model.find((item) => item.province.id === provinceId);
  assert.equal(entry.country.id, "local_polities", provinceId);
  assert.equal(entry.historicalProvince.polityId, null, provinceId);
}

for (const provinceId of ["galatia-ankara", "cappadocia-kayseri", "cappadocia-sivas", "euphrates-malatya", "eastern-anatolia-erzincan", "eastern-anatolia-erzurum"]) {
  const entry = model.find((item) => item.province.id === provinceId);
  assert.equal(entry.country.id, "ilkhanate", provinceId);
  assert.equal(entry.historicalProvince.polityId, null, provinceId);
  assert.equal(entry.historicalProvince.controlStatus, "Ilkhanid-suzerainty", provinceId);
}

const anachronisticOwnerProvince = sourceProvinces.find((province) => province.id === "phrygia-eskisehir");
assert.equal(anachronisticOwnerProvince.owner, "ottomans");
assert.equal(model.find((entry) => entry.province.id === "phrygia-eskisehir").historicalProvince.polityId, null);

assert.equal(createHistoricalPoliticalMapModel({ date: "1301-01-01", provinces: sourceProvinces, countryRepository: repository }), null);
assert.throws(
  () => createHistoricalPoliticalPresentation({
    polityId: "byzantium",
    country: { id: "byzantium", color: "#6A1B9A", sourceType: "modern-admin0", timeModel: "modern" },
  }),
  /Modern or untagged country identity cannot render a historical province/,
);

console.log(`Historical Political Map v1 tests passed: ${model.length} Anatolia provinces, complete political presentation, suzerainty semantics, city↔province links, and 1300-only model active.`);
