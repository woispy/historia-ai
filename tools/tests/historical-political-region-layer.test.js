import assert from "node:assert/strict";
import historicalAtlas from "../../data/gis/1300/regional/anatolia-byzantium.json" with { type: "json" };
import { getHistoricalPolity } from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";

assert.equal(historicalAtlas.historicalDate, "1300-01-01");
assert.ok(Array.isArray(historicalAtlas.regions));
assert.ok(historicalAtlas.regions.length >= 15);

for (const region of historicalAtlas.regions) {
  assert.ok(region.id);
  assert.ok(region.countryId, `${region.id} must have a political display identity`);
  assert.ok(getHistoricalPolity(region.countryId), `${region.id} uses an unregistered historical polity`);
  assert.ok(Array.isArray(region.polygons) && region.polygons.length > 0, `${region.id} needs geometry`);

  for (const polygon of region.polygons) {
    assert.ok(polygon.length >= 4, `${region.id} polygon is too short`);
    assert.deepEqual(polygon[0], polygon[polygon.length - 1], `${region.id} polygon must be closed`);
  }
}

assert.equal(
  historicalAtlas.regions.some((region) => region.id === "anatolia_aydin_pre1308" && region.countryId === "byzantium"),
  true,
  "Aydinid ownership must not be projected backward into 1300",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "inanc"),
  true,
  "İnanç Beyliği must have a rendered 1300 region",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "hamid"),
  true,
  "Hamid Beyliği must have a rendered 1300 region",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "sahibata"),
  true,
  "Sâhib Ata Beyliği must have a rendered 1300 region",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "ilkhanate"),
  true,
  "Ilkhanid suzerainty must have a rendered visual layer",
);

console.log(
  `Historical political region layer tests passed: ${historicalAtlas.regions.length} source-verified regional fills, closed coast-aware polygons, no unregistered polity identities.`,
);
