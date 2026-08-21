import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
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
  ["karaman", { id: "karaman", name: "Karamanid Beylik", color: "#A33F3F" }],
  ["pervane", { id: "pervane", name: "Pervâneoğlu Beylik", color: "#6B7280" }],
  ["candar", { id: "candar", name: "Candarid Beylik", color: "#7A6A3A" }],
  ["trebizond", { id: "trebizond", name: "Empire of Trebizond", color: "#5D6B8A" }],
  ["cilicia", { id: "cilicia", name: "Armenian Kingdom of Cilicia", color: "#8B3A3A" }],
].map(([id, country]) => [id, {
  ...country,
  id,
  timeModel: "historical",
  sourceType: "historical-runtime",
}]));

const repository = { byId: countries };
const sourceProvinces = ANATOLIA_PROVINCE_METADATA.map((metadata) => ({
  id: metadata.id,
  owner: metadata.historicalControl?.controllerAt1300 ?? "local_polities",
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
assert.equal(model.find((entry) => entry.province.id === "lycaonia-konya").country.id, "karaman");
assert.equal(model.find((entry) => entry.province.id === "pontus-sinop").country.id, "pervane");
assert.equal(model.find((entry) => entry.province.id === "pontus-kastamon").country.id, "candar");
assert.equal(model.find((entry) => entry.province.id === "pontus-trebizond").country.id, "trebizond");
assert.equal(model.find((entry) => entry.province.id === "cilicia-sis").country.id, "cilicia");

for (const entry of model) {
  assert.equal(entry.country.type, "polity");
  assert.equal(entry.country.timeModel, "historical");
  assert.equal(entry.country.sourceType, "historical-runtime");
  assert.ok(/^#[0-9a-f]{6}$/i.test(entry.country.color));
}

assert.equal(model.find((entry) => entry.province.id === "ionia-ayasuluk").country.id, "local_polities");
assert.equal(model.find((entry) => entry.province.id === "phrygia-eskisehir").country.id, "local_polities");
assert.equal(model.find((entry) => entry.province.id === "cappadocia-kayseri").country.id, "local_polities");
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
  + "12 historical polity presentations, neutral layered provinces preserved, 1300-only model active.",
);
