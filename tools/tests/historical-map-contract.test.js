import assert from "node:assert/strict";
import {
  HISTORICAL_MAP_ENTITY_TYPES,
  HISTORICAL_MAP_POLICY,
  createHistoricalMapDescriptor,
  isHistoricalMapDate,
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
  polities: [{ id: "ottomans", name: "Osmanoğulları" }],
});

assert.equal(descriptor.date, "1300-01-01");
assert.equal(descriptor.polities.length, 1);
assert.equal(descriptor.polities[0].id, "ottomans");
assert.equal(descriptor.entityTypes.city, "city");
assert.equal(descriptor.policy.modernCountryFallback, false);

console.log("Historical map contract tests passed.");
