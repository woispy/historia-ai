import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import {
  getMapLod,
  getPhysicalStrokeProfile,
} from "../../src/map/rendering/CartographyModel.js";
import { boxesOverlap, getCityVisualStyle, layoutCityLabels, selectVisibleCities } from "../../src/map/rendering/city/CityLabelLayout.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
assert.equal(getMapLod(1), "world");
assert.equal(getMapLod(2.8), "city");
assert.equal(getMapLod(8), "detailed");

for (const zoom of [1.2, 2.8, 3.6, 5, 8]) {
  const visible = selectVisibleCities(cities, zoom);
  const labels = layoutCityLabels(visible, zoom);
  assert.ok(labels.length > 0, `Expected city labels at zoom ${zoom}`);
  assert.ok(labels.length <= 32, `Label budget exceeded at zoom ${zoom}`);
  const placedBoxes = [];
  for (const label of labels) {
    const style = getCityVisualStyle(label.city, zoom);
    assert.ok(style.fontSize >= 0.045, `City label authored size became unreadable at zoom ${zoom}`);
    assert.ok(style.screenScale > 0, `City label render scale must remain positive at zoom ${zoom}`);
    const width = Math.max(0.34, String(label.city.map.name).length * style.effectiveFontSize * 0.44);
    const half = width / 2;
    const box = {
      left: label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - half,
      right: label.anchor === "start" ? label.x + width : label.anchor === "end" ? label.x : label.x + half,
      top: label.y - style.effectiveFontSize * 0.76,
      bottom: label.y + style.effectiveFontSize * 0.22,
    };
    for (const other of placedBoxes) assert.equal(boxesOverlap(box, other), false, `City labels overlap at zoom ${zoom}`);
    placedBoxes.push(box);
  }
}

const capital = cities.find((city) => city.map.tier === "capital");
assert.ok(capital, "The historical city atlas must contain a capital city.");
for (const zoom of [1.2, 2, 2.8, 3.6, 5, 8, 12, 16]) {
  const style = getCityVisualStyle(capital, zoom);
  assert.ok(style.fontSize >= 0.045, `City label authored size became unreadable at zoom ${zoom}`);
  assert.ok(style.screenSize > 0, `City label screen size must remain positive at zoom ${zoom}`);
  assert.ok(style.screenSize <= 0.42, `City label grew in screen-space at zoom ${zoom}`);
}

const screenSizes = [1.2, 2, 2.8, 3.6, 5, 8, 12, 16]
  .map((zoom) => getCityVisualStyle(capital, zoom).screenSize);
for (let index = 1; index < screenSizes.length; index += 1) {
  assert.ok(Math.abs(screenSizes[index] - screenSizes[1]) < 1e-9, "City label screen-space size must remain stable across deep zoom");
}

assert.equal(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length, 0, "Cartography runtime must not eagerly import lake geometry.");
assert.equal(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers.length, 0, "Cartography runtime must not eagerly import river geometry.");
assert.ok(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.labels.filter((label) => label.kind === "sea").every((label) => label.maxZoom >= 8));

const regionalStroke = getPhysicalStrokeProfile(1.3);
const detailedStroke = getPhysicalStrokeProfile(4);
assert.ok(detailedStroke.river > regionalStroke.river, "Detailed rivers should remain visually legible");
assert.ok(detailedStroke.lake > 0, "Detailed lakes need a visible outline");

for (const id of ["konstantinopolis", "iznik", "bursa", "ankara", "konya", "kayseri", "sivas", "trabzon", "erzurum"]) {
  assert.ok(ANATOLIA_CITY_ATLAS[id], `Missing historical city atlas entry: ${id}`);
}
console.log(`Cartography foundation tests passed: ${cities.length} cities, lazy hydrography runtime, deterministic labels across 5 zoom levels.`);
