import assert from "node:assert/strict";
import { HISTORICAL_WORLD_1300, getHistoricalWorldCity, getHistoricalWorldPolity } from "../../src/world/historical/HistoricalWorld1300Registry.js";

assert.equal(HISTORICAL_WORLD_1300.date, "1300-01-01");
assert.ok(HISTORICAL_WORLD_1300.polities.length >= 30);
assert.ok(HISTORICAL_WORLD_1300.cityAnchors.length >= 20);

for (const polity of HISTORICAL_WORLD_1300.polities) {
  assert.ok(polity.id);
  assert.ok(polity.name);
  assert.ok(["high", "medium", "low"].includes(polity.boundaryConfidence));
}

for (const city of HISTORICAL_WORLD_1300.cityAnchors) {
  assert.ok(city.name);
  assert.ok(Number.isFinite(city.x));
  assert.ok(Number.isFinite(city.y));
  assert.ok(city.x >= -180 && city.x <= 180);
  assert.ok(city.y >= -90 && city.y <= 90);
}

assert.equal(getHistoricalWorldPolity("ilkhanate")?.name, "Ilkhanate");
assert.equal(getHistoricalWorldPolity("delhi")?.name, "Delhi Sultanate — Khalji");
assert.equal(getHistoricalWorldCity("Constantinople")?.x, 28.9784);
assert.equal(getHistoricalWorldCity("Dadu")?.y, 39.9042);
assert.equal(getHistoricalWorldPolity("does-not-exist"), null);

console.log("Historical World 1300 anchor tests passed.");
