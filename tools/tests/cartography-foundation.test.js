import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { getMapLod } from "../../src/map/rendering/CartographyModel.js";
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
    assert.ok(style.fontSize >= 0.045, `City label became sub-pixel at zoom ${zoom}`);
    const width = Math.max(0.34, String(label.city.map.name).length * style.fontSize * 0.44);
    const half = width / 2;
    const box = {
      left: label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - half,
      right: label.anchor === "start" ? label.x + width : label.anchor === "end" ? label.x : label.x + half,
      top: label.y - style.fontSize * 0.76,
      bottom: label.y + style.fontSize * 0.22,
    };
    for (const other of placedBoxes) assert.equal(boxesOverlap(box, other), false, `City labels overlap at zoom ${zoom}`);
    placedBoxes.push(box);
  }
}

assert.ok(getCityVisualStyle(cities[0], 8).fontSize > 0.1);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.lakes.length >= 8);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.rivers.length >= 10);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.labels.filter((label) => label.kind === "sea").every((label) => label.maxZoom >= 8));
for (const id of ["konstantinopolis", "iznik", "bursa", "ankara", "konya", "kayseri", "sivas", "trabzon", "erzurum"]) {
  assert.ok(ANATOLIA_CITY_ATLAS[id], `Missing historical city atlas entry: ${id}`);
}
console.log(`Cartography foundation tests passed: ${cities.length} cities, ${ANATOLIA_PHYSICAL_ATLAS.rivers.length} rivers, ${ANATOLIA_PHYSICAL_ATLAS.lakes.length} lakes, deterministic labels across 5 zoom levels.`);
