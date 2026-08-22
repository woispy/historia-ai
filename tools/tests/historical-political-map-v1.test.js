import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { createHistoricalPoliticalMapModel } from "../../src/world/map/historical/HistoricalPoliticalMapModel.js";
import { createHistoricalPoliticalPresentation } from "../../src/world/map/historical/HistoricalPoliticalPresentation.js";

const countries = Object.fromEntries([
  ["local_polities", { id: "local_polities", name: "Local Polities", color: "#6f765f" }],
  ["byzantium", { id: "byzantium", name: "Eastern Roman Empire", color: "#6A1B9A" }],
  ["ottomans", { id: "ottomans", name: "Ottoman Beylik", color: "#0F7A32" }],
  ["karasi", { id: "karasi", name: "Karasi Beylik", color: "#B87333" }],
  ["saruhan", { id: "saruhan", name: "Saruhan Beylik", color: "#786A9D" }],
  ["mentese", { id: "mentese", name: "Menteshe Beylik", color: "#3E7C59" }],
  ["esref", { id: "esref", name: "Eşrefoğulları Beylik", color: "#7B6840" }],
  ["germiyan", { id: "germiyan", name: "Germiyanid Beylik", color: "#8C5A2B" }],
  ["inanc", { id: "inanc", name: "İnanç Beyliği", color: "#5E8C61" }],
  ["hamid", { id: "hamid", name: "Hamid Beyliği", color: "#4F8065" }],
  ["sahibata", { id: "sahibata", name: "Sâhib Ata Beyliği", color: "#806A4A" }],
  ["karaman", { id: "karaman", name: "Karamanid Beylik", color: "#A33F3F" }],
  ["pervane", { id: "pervane", name: "Pervâneoğlu Beylik", color: "#6B7280" }],
  ["candar", { id: "candar", name: "Candarid Beylik", color: "#7A6A3A" }],
  ["trebizond", { id: "trebizond", name: "Empire of Trebizond", color: "#4A7896" }],
  ["cilicia", { id: "cilicia", name: "Kingdom of Cilicia", color: "#8B4A62" }],
].map(([id, country]) => [id, {
  ...country,
  id,
  timeModel: "historical",
  sourceType: "historical-runtime",
}]));

const repository = { byId: countries };
const sourceProvinces = ANATOLIA_PROVINCE_METADATA.map((metadata) => ({
  id: metadata.id,
  owner: metadata.countryId,
}));

const model = createHistoricalPoliticalMapModel({
  date: "1300-01-01",
  provinces: sourceProvinces,
  countryRepository: repository,
});

assert.equal(model.length, 38);
assert.equal(model.find((entry) => entry.province.id === "bithynia-nicomedia").country.id, "byzantium");
assert.equal(model.find((entry) => entry.province.id === "phrygia-sogut").country.id, "ottomans");
assert.equal(model.find((entry) => entry.province.id === "mysia-balikesir").country.id, "karasi");
assert.equal(model.find((entry) => entry.province.id === "lydia-magnesia").country.id, "saruhan");
assert.equal(model.find((entry) => entry.province.id === "caria-mylasa").country.id, "mentese");
assert.equal(model.find((entry) => entry.province.id === "pisidia-beysehir").country.id, "esref");
assert.equal(model.find((entry) => entry.province.id === "phrygia-kutahya").country.id, "germiyan");
assert.equal(model.find((entry) => entry.province.id === "phrygia-denizli").country.id, "inanc");
assert.equal(model.find((entry) => entry.province.id === "phrygia-uluborlu").country.id, "hamid");
assert.equal(model.find((entry) => entry.province.id === "phrygia-afyon").country.id, "sahibata");
assert.equal(model.find((entry) => entry.province.id === "lycaonia-konya").country.id, "karaman");
assert.equal(model.find((entry) => entry.province.id === "pontus-sinop").country.id, "pervane");
assert.equal(model.find((entry) => entry.province.id === "pontus-kastamon").country.id, "candar");
assert.equal(model.find((entry) => entry.province.id === "pontus-trebizond").country.id, "trebizond");
assert.equal(model.find((entry) => entry.province.id === "cilicia-sis").country.id, "cilicia");
assert.equal(model.find((entry) => entry.province.id === "ionia-ayasuluk").country.id, "byzantium");
assert.equal(model.find((entry) => entry.province.id === "lydia-birgi").country.id, "byzantium");

for (const entry of model) {
  assert.equal(entry.country.type, "polity");
  assert.equal(entry.country.timeModel, "historical");
  assert.equal(entry.country.sourceType, "historical-runtime");
  assert.ok(/^#[0-9a-f]{6}$/i.test(entry.country.color));

  const metadata = ANATOLIA_PROVINCE_METADATA.find((province) => province.id === entry.province.id);
  assert.ok(metadata, `Missing metadata for ${entry.province.id}`);
  const city = ANATOLIA_CITY_ATLAS[metadata.cityId];
  assert.ok(city, `${entry.province.id} must resolve to a known city atlas record`);

  const reverseProvinceIds = Array.isArray(city.mapProvinceIds)
    ? city.mapProvinceIds
    : [city.mapProvinceId].filter(Boolean);
  assert.ok(
    reverseProvinceIds.includes(entry.province.id),
    `${metadata.cityId} must point back to its owning historical province`,
  );
}

assert.deepEqual(
  ANATOLIA_CITY_ATLAS.eskisehir.mapProvinceIds,
  ["bithynia-sangarios", "phrygia-eskisehir"],
);
assert.equal(ANATOLIA_CITY_ATLAS.eskisehir.mapProvinceId, "phrygia-eskisehir");

// Neutral/contested provinces still receive a complete historical presentation
// color; they are never rendered as transparent or as a modern country.
for (const provinceId of ["phrygia-eskisehir", "lydia-smyrna", "galatia-ankara", "cappadocia-kayseri", "pontus-amasya"]) {
  const entry = model.find((item) => item.province.id === provinceId);
  assert.ok(entry.country, `${provinceId} must never render without a political presentation`);
  assert.equal(entry.country.id, "local_polities");
}

const anachronisticOwnerProvince = sourceProvinces.find((province) => province.id === "phrygia-eskisehir");
assert.equal(anachronisticOwnerProvince.owner, "ottomans");
assert.equal(
  model.find((entry) => entry.province.id === "phrygia-eskisehir").historicalProvince.polityId,
  null,
);

assert.equal(createHistoricalPoliticalMapModel({
  date: "1301-01-01",
  provinces: sourceProvinces,
  countryRepository: repository,
}), null);

assert.throws(
  () => createHistoricalPoliticalPresentation({
    polityId: "byzantium",
    country: { id: "byzantium", color: "#6A1B9A", sourceType: "modern-admin0", timeModel: "modern" },
  }),
  /Modern or untagged country identity cannot render a historical province/,
);

console.log(
  `Historical Political Map v1 tests passed: ${model.length} Anatolia provinces, `
  + "complete political presentation, city↔province identity links, historical polity presentation enforced, 1300-only model active.",
);
