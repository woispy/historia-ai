import assert from "node:assert/strict";
import {
  ANATOLIA_1300_POLITIES,
  ANATOLIA_1300_REGIONS,
  HISTORICAL_CONFIDENCE,
  isPolityActiveAt1300,
} from "../../src/map/data/Anatolia1300HistoricalProfile.js";
import {
  ANATOLIA_PROVINCE_METADATA,
  getProvinceMetadata,
} from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";

const validConfidence = new Set(HISTORICAL_CONFIDENCE);
const provinceIds = new Set();
const cityIds = new Set();

assert.equal(ANATOLIA_1300_REGIONS.length, 10, "Phase 2B must define ten reconstruction regions");
assert.ok(Object.keys(ANATOLIA_1300_POLITIES).length >= 14, "Phase 2B must cover the major 1300 political contexts");

for (const region of ANATOLIA_1300_REGIONS) {
  assert.ok(region.id && region.name, "Every region needs a stable id and name");
  assert.ok(validConfidence.has(region.confidence), `${region.id} has invalid confidence`);
  assert.ok(region.provinceIds.length > 0, `${region.id} must contain at least one province anchor`);
}

for (const polity of Object.values(ANATOLIA_1300_POLITIES)) {
  assert.ok(validConfidence.has(polity.confidence), `${polity.id} has invalid confidence`);
  assert.ok(Number.isInteger(polity.startYear), `${polity.id} needs a numeric startYear`);
  assert.ok(isPolityActiveAt1300(polity) === (polity.startYear <= 1300 && (polity.endYear == null || polity.endYear >= 1300)));
}

for (const province of ANATOLIA_PROVINCE_METADATA) {
  assert.ok(!provinceIds.has(province.id), `Duplicate province id: ${province.id}`);
  provinceIds.add(province.id);

  assert.ok(province.regionId, `${province.id} must belong to a Phase 2B region`);
  assert.ok(province.centroid.length === 2, `${province.id} must have [lon, lat] centroid`);
  assert.ok(province.centroid[0] >= -180 && province.centroid[0] <= 180, `${province.id} longitude out of range`);
  assert.ok(province.centroid[1] >= -90 && province.centroid[1] <= 90, `${province.id} latitude out of range`);
  assert.ok(validConfidence.has(province.borderConfidence), `${province.id} has invalid border confidence`);
  assert.ok(validConfidence.has(province.historicalControl.confidence), `${province.id} has invalid historical confidence`);

  if (province.cityId) {
    assert.ok(ANATOLIA_CITY_ATLAS[province.cityId], `${province.id} references missing city ${province.cityId}`);
    cityIds.add(province.cityId);
  }

  const resolved = getProvinceMetadata(province.id);
  assert.equal(resolved?.id, province.id, `${province.id} must resolve through the province registry`);
}

for (const region of ANATOLIA_1300_REGIONS) {
  for (const provinceId of region.provinceIds) {
    assert.ok(provinceIds.has(provinceId), `${region.id} references missing province ${provinceId}`);
    assert.equal(getProvinceMetadata(provinceId)?.regionId, region.id, `${provinceId} must resolve back to ${region.id}`);
  }
}

assert.equal(getProvinceMetadata("ionia-ayasuluk")?.countryId, null, "Aydinid ownership must not be projected onto 1300");
assert.equal(getProvinceMetadata("lydia-birgi")?.countryId, null, "Aydinid ownership must not be projected onto 1300");
assert.equal(getProvinceMetadata("phrygia-uluborlu")?.historicalControl.controllerAt1300, null, "Hamidid control is an emerging 1300 transition");
assert.equal(getProvinceMetadata("pisidia-egirdir")?.historicalControl.controllerAt1300, null, "Hamidid control is an emerging 1300 transition");
assert.equal(getProvinceMetadata("pontus-sinop")?.countryId, "pervane", "Sinop must remain Pervaneoğlu in 1300");
assert.equal(getProvinceMetadata("phrygia-kutahya")?.countryId, "germiyan", "Kütahya must anchor the Germiyanid reconstruction");
assert.equal(getProvinceMetadata("caria-mylasa")?.countryId, "mentese", "Mylasa must anchor the Menteshe reconstruction");
assert.equal(getProvinceMetadata("bithynia-nicomedia")?.countryId, "byzantium", "Nicomedia must anchor Byzantine Bithynia");

for (const cityId of cityIds) {
  const city = ANATOLIA_CITY_ATLAS[cityId];
  assert.ok(city.mapProvinceId, `${cityId} must have a Phase 2B province mapping`);
  assert.ok(provinceIds.has(city.mapProvinceId), `${cityId} points to an unknown Phase 2B province ${city.mapProvinceId}`);
}

assert.equal(ANATOLIA_CITY_ATLAS.konstantinopolis.mapProvinceId, null, "Constantinople is outside the Anatolian province vocabulary");
assert.equal(ANATOLIA_CITY_ATLAS.edirne.mapProvinceId, null, "Adrianopolis is outside the Anatolian province vocabulary");

console.log(`Phase 2B Anatolia reconstruction tests passed: ${ANATOLIA_PROVINCE_METADATA.length} province anchors, ${ANATOLIA_1300_REGIONS.length} regions, ${Object.keys(ANATOLIA_1300_POLITIES).length} political contexts.`);
