import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { getCityVisualStyle } from "../../src/map/rendering/city/CityLabelLayout.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
const capital = cities.find((city) => city.map.tier === "capital");
assert.ok(capital, "The 1300 atlas must contain at least one capital city.");

const far = getCityVisualStyle(capital, 1).fontSize;
const regional = getCityVisualStyle(capital, 1.5).fontSize;
const province = getCityVisualStyle(capital, 2.5).fontSize;
const deep = getCityVisualStyle(capital, 8).fontSize;
const veryDeep = getCityVisualStyle(capital, 16).fontSize;

assert.ok(far > regional, "World labels should not grow as the camera moves away.");
assert.ok(regional > province, "Regional labels should shrink with camera zoom.");
assert.ok(province > deep, "Province labels should shrink with camera zoom.");
assert.ok(deep >= veryDeep, "Deep zoom must never make labels larger again.");
assert.ok(veryDeep >= 0.045, "Deep zoom labels need a readable lower bound.");

console.log("City label scale regression tests passed.");
