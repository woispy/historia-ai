import assert from "node:assert/strict";
import { ANATOLIA_REGION_LABELS, ANATOLIA_STRATEGIC_CORRIDORS, ANATOLIA_STRATEGIC_PASSES, ANATOLIA_STRATEGIC_CROSSINGS } from "../../src/map/data/AnatoliaStrategicAtlas.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { getMapLod } from "../../src/map/rendering/CartographyModel.js";
import { boxesOverlap, getCityLabelBudget, getCityMarkerBudget, getCityVisualStyle, layoutCityLabels, selectVisibleCities } from "../../src/map/rendering/city/CityLabelLayout.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(getMapLod(1) === "world", "world LOD threshold changed unexpectedly");
assert(getMapLod(4) === "detailed", "detailed LOD threshold changed unexpectedly");

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
const regionalCities = selectVisibleCities(cities, 1.4);
const detailedCities = selectVisibleCities(cities, 4.0);
assert(regionalCities.length <= getCityMarkerBudget(1.4), "regional city marker budget exceeded");
assert(detailedCities.length <= getCityMarkerBudget(4.0), "detailed city marker budget exceeded");
assert(regionalCities[0]?.map?.tier === "capital", "highest priority regional city should be a capital");

const capital = { id: "capital", map: { name: "Konstantinopolis", x: 28.9784, y: 41.0082, tier: "capital" } };
const nearby = { id: "nearby", map: { name: "Nikaia", x: 29.01, y: 41.01, tier: "major" } };
const far = { id: "far", map: { name: "Dorylaion", x: 30.52, y: 39.77, tier: "major" } };
const labels = layoutCityLabels([capital, nearby, far], 2.9);
assert(labels.some((label) => label.city.id === "capital"), "capital label should survive collision layout");
assert(labels.length <= getCityLabelBudget(2.9), "collision layout exceeded label budget");
const mediumFont = getCityVisualStyle(capital, 2).fontSize;
const deepFont = getCityVisualStyle(capital, 8).fontSize;
assert(deepFont <= mediumFont, "deep zoom should not inflate label size");
assert(deepFont > 0.1, "deep zoom city label should remain readable");
assert(boxesOverlap({ left: 0, right: 1, top: 0, bottom: 1 }, { left: 0.9, right: 2, top: 0, bottom: 1 }), "overlap predicate failed");
assert(!boxesOverlap({ left: 0, right: 1, top: 0, bottom: 1 }, { left: 1.2, right: 2, top: 0, bottom: 1 }), "overlap predicate false positive");

assert(ANATOLIA_REGION_LABELS.length === 6, "expected six Anatolia regional labels");
assert(ANATOLIA_STRATEGIC_CORRIDORS.length >= 9, "strategic corridor atlas is incomplete");
assert(ANATOLIA_STRATEGIC_PASSES.length >= 5, "strategic pass atlas is incomplete");
assert(ANATOLIA_STRATEGIC_CROSSINGS.length >= 7, "strategic crossing atlas is incomplete");

console.log("Phase 2E-2H cartography tests passed: 6 regions, 9 corridors, 5 passes, 7 crossings.");
