import assert from "node:assert/strict";
import {
  HISTORICAL_MAP_ENTITY_TYPES,
  HISTORICAL_MAP_POLICY,
  assertHistoricalPoliticalIdentities,
  assertHistoricalPoliticalIdentity,
  createHistoricalMapDescriptor,
  isHistoricalMapDate,
  isModernAdmin0Identity,
} from "../../src/world/map/HistoricalMapContract.js";

assert.equal(isHistoricalMapDate("1300-01-01"), true);
assert.equal(isHistoricalMapDate("1300"), false);
assert.equal(isHistoricalMapDate(null), false);

assert.deepEqual(HISTORICAL_MAP_ENTITY_TYPES, {
  polity: "polity",
  territory: "territory",
  region: "region",
  province: "province",
  city: "city",
  settlement: "settlement",
});

assert.equal(HISTORICAL_MAP_POLICY.politicalSource, "historical-runtime");
assert.equal(HISTORICAL_MAP_POLICY.physicalSource, "physical-atlas");
assert.equal(HISTORICAL_MAP_POLICY.modernCountryFallback, false);
assert.equal(HISTORICAL_MAP_POLICY.cityIsProvince, false);
assert.equal(HISTORICAL_MAP_POLICY.cityClickChangesZoomOnly, false);

const descriptor = createHistoricalMapDescriptor({
  date: "1300-01-01",
  polities: [{ id: "ottomans", name: "Osmanoğulları", type: "polity" }],
});

assert.equal(descriptor.date, "1300-01-01");
assert.equal(descriptor.polities.length, 1);
assert.equal(descriptor.polities[0].id, "ottomans");
assert.equal(descriptor.entityTypes.city, "city");
assert.equal(descriptor.policy.modernCountryFallback, false);

assert.equal(isModernAdmin0Identity({ id: "tur", sourceType: "modern-admin0" }), true);
assert.equal(isModernAdmin0Identity({ id: "Turkey", dataset: "admin-0-countries" }), true);
assert.equal(isModernAdmin0Identity({ id: "turkey", provider: "natural-earth-admin-0" }), true);
assert.equal(isModernAdmin0Identity({ id: "ottomans", source: "historical-runtime", type: "polity" }), false);
assert.equal(isModernAdmin0Identity({ id: "bursa", source: "historical-runtime", type: "city" }), false);

assert.throws(
  () => assertHistoricalPoliticalIdentity({ id: "tur", sourceType: "modern-admin0", type: "polity" }),
  /Modern Admin-0 identity cannot enter historical political runtime/,
);

assert.throws(
  () => assertHistoricalPoliticalIdentity({ id: "bursa", type: "city" }),
  /does not accept entity type: city/,
);

assert.throws(
  () => assertHistoricalPoliticalIdentity({ id: "turkey", adminLevel: 0 }),
  /Modern Admin-0 identity cannot enter historical political runtime/,
);

assertHistoricalPoliticalIdentities([
  { id: "byzantium", type: "polity" },
  { id: "bursa", type: "province" },
]);

console.log("Historical map contract tests passed: identity firewall, entity separation, and historical provenance policy.");
