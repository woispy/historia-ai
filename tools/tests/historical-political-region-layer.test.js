import assert from "node:assert/strict";
import historicalAtlas from "../../data/gis/1300/regional/anatolia-byzantium.json" with { type: "json" };
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalMapModel } from "../../src/world/map/historical/HistoricalPoliticalMapModel.js";
import { getHistoricalPolity } from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";
import { getHistoricalPoliticalOverlayMode } from "../../src/map/components/layers/HistoricalPoliticalRegionLayer.jsx";

assert.equal(historicalAtlas.historicalDate, "1300-01-01");
assert.ok(Array.isArray(historicalAtlas.regions));
assert.ok(historicalAtlas.regions.length >= 15);

for (const region of historicalAtlas.regions) {
  assert.ok(region.id);
  assert.ok(region.countryId, `${region.id} must have a political display identity`);
  assert.ok(getHistoricalPolity(region.countryId), `${region.id} uses an unregistered historical polity`);
  assert.ok(Array.isArray(region.polygons) && region.polygons.length > 0, `${region.id} needs research geometry`);

  for (const polygon of region.polygons) {
    assert.ok(polygon.length >= 4, `${region.id} polygon is too short`);
    assert.deepEqual(polygon[0], polygon[polygon.length - 1], `${region.id} polygon must be closed`);
  }
}

const runtimeProvinces = ANATOLIA_PROVINCE_METADATA.map((metadata) => ({
  id: metadata.id,
  owner: metadata.countryId ?? null,
}));
const politicalModel = createHistoricalPoliticalMapModel({
  date: "1300-01-01",
  provinces: runtimeProvinces,
  countryRepository: { byId: {} },
});

assert.equal(politicalModel.length, 38, "the 1300 political presentation must cover all 38 provinces");
assert.equal(
  politicalModel.every((entry) => entry.historicalPolitical?.id),
  true,
  "every province must have a visible historical political presentation, including neutral areas",
);

const byProvince = new Map(politicalModel.map((entry) => [entry.province.id, entry]));
assert.equal(byProvince.get("cappadocia-kayseri").historicalPolitical.id, "ilkhanate");
assert.equal(byProvince.get("cappadocia-kayseri").historicalProvince.controlStatus, "Ilkhanid-suzerainty");
assert.equal(byProvince.get("ionia-ayasuluk").historicalPolitical.id, "byzantium");
assert.equal(byProvince.get("lydia-birgi").historicalPolitical.id, "byzantium");
assert.equal(byProvince.get("phrygia-denizli").historicalPolitical.id, "inanc");
assert.equal(byProvince.get("phrygia-uluborlu").historicalPolitical.id, "hamid");
assert.equal(byProvince.get("phrygia-afyon").historicalPolitical.id, "sahibata");

assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("cappadocia-kayseri")),
  "suzerainty",
);
assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("phrygia-eskisehir")),
  "contested",
);
assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("ionia-ayasuluk")),
  "sovereign",
);

assert.equal(
  historicalAtlas.regions.some((region) => region.id === "anatolia_aydin_pre1308" && region.countryId === "byzantium"),
  true,
  "Aydinid ownership must not be projected backward into 1300",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "inanc"),
  true,
  "İnanç Beyliği must remain represented in the research atlas",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "hamid"),
  true,
  "Hamid Beyliği must remain represented in the research atlas",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "sahibata"),
  true,
  "Sâhib Ata Beyliği must remain represented in the research atlas",
);

console.log(
  `Historical political region layer tests passed: ${politicalModel.length} rendered province presentations plus ${historicalAtlas.regions.length} research regions.`,
);
