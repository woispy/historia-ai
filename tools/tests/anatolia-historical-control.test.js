import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const expectedEstablishedControllers = Object.freeze({
  "bithynia-nicomedia": "byzantium",
  "bithynia-nicaea": "byzantium",
  "bithynia-prusa": "byzantium",
  "phrygia-sogut": "ottomans",
  "mysia-balikesir": "karasi",
  "lydia-magnesia": "saruhan",
  "caria-mylasa": "mentese",
  "caria-pecin": "mentese",
  "caria-halikarnassos": "mentese",
  "pisidia-beysehir": "esref",
  "phrygia-kutahya": "germiyan",
  "lycaonia-konya": "karaman",
  "lycaonia-larende": "karaman",
  "pontus-sinop": "pervane",
  "pontus-amisos": "pervane",
  "pontus-kastamon": "candar",
});

const metadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, province]));

assert.equal(ANATOLIA_PROVINCE_METADATA.length, 38, "1300 Anatolia must retain the curated 38-province presentation layer");
assert.equal(metadataById.size, 38, "1300 Anatolia province IDs must be unique");

for (const province of ANATOLIA_PROVINCE_METADATA) {
  assert.ok(province.id, "Every historical province needs a stable identity");
  assert.ok(province.cityId, `${province.id} must retain a city anchor");
  assert.ok(Array.isArray(province.centroid) && province.centroid.length === 2, `${province.id} must retain a geographic anchor`);
  assert.notEqual(province.countryId, "turkey", `${province.id} must not use a modern Turkey identity`);
  assert.notEqual(province.countryId, "türkiye", `${province.id} must not use a modern Türkiye identity`);

  const control = province.historicalControl;
  assert.ok(control && typeof control === "object", `${province.id} must expose dated historical control metadata`);
  assert.ok(["high", "medium", "low"].includes(control.confidence), `${province.id} has invalid control confidence`);
  assert.ok(control.statusAt1300, `${province.id} must describe its 1300 control status`);
}

for (const [provinceId, controllerId] of Object.entries(expectedEstablishedControllers)) {
  const province = metadataById.get(provinceId);
  assert.ok(province, `Missing expected 1300 anchor province: ${provinceId}`);
  assert.equal(
    province.historicalControl.controllerAt1300,
    controllerId,
    `${provinceId} must retain its intended 1300 controller`,
  );
}

for (const provinceId of ["ionia-ayasuluk", "lydia-birgi", "phrygia-uluborlu", "pisidia-egirdir"]) {
  const province = metadataById.get(provinceId);
  assert.ok(province);
  assert.equal(
    province.historicalControl.controllerAt1300,
    null,
    `${provinceId} must not back-project a later beylik into the 1300 start date`,
  );
  assert.ok(province.historicalControl.startYear > 1300);
}

const byzantineCore = ANATOLIA_PROVINCE_METADATA.filter(
  (province) => province.historicalControl.controllerAt1300 === "byzantium",
);
assert.equal(byzantineCore.length, 3, "1300 Byzantine Anatolian core must retain the three explicit Bithynian anchors");

const beylikControllers = new Set(
  ANATOLIA_PROVINCE_METADATA
    .map((province) => province.historicalControl.controllerAt1300)
    .filter((controller) => controller && controller !== "byzantium" && controller !== "ottomans"),
);

for (const controller of ["karasi", "saruhan", "mentese", "germiyan", "esref", "karaman", "pervane", "candar"]) {
  assert.ok(beylikControllers.has(controller), `1300 Anatolia must expose a distinct ${controller} polity anchor`);
}

console.log(
  `Historical Anatolia control tests passed: ${ANATOLIA_PROVINCE_METADATA.length} provinces, `
  + `${byzantineCore.length} Byzantine core anchors, ${beylikControllers.size} distinct beylik/local-polity anchors.`,
);
