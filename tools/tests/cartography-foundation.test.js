import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import {
  getMapLod,
  getPhysicalStrokeProfile,
  shouldUseGpuProvinceFill,
} from "../../src/map/rendering/CartographyModel.js";
import { boxesOverlap, getCityVisualStyle, layoutCityLabels, selectVisibleCities } from "../../src/map/rendering/city/CityLabelLayout.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
assert.equal(getMapLod(1), "world");
assert.equal(getMapLod(2.8), "city");
assert.equal(getMapLod(8), "detailed");

assert.equal(shouldUseGpuProvinceFill(1), true);
assert.equal(shouldUseGpuProvinceFill(1.74), true);
assert.equal(shouldUseGpuProvinceFill(1.75), true);
assert.equal(shouldUseGpuProvinceFill(1.85), false);
assert.equal(shouldUseGpuProvinceFill(3.35), false);

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

// Font size is expressed in world-space units. At deep zoom, readability is
// validated in screen-space rather than by requiring the world-space value to
// grow, which would contradict the screen-stable inverse-zoom policy.
assert.ok(getCityVisualStyle(cities[0], 8).fontSize * 8 > 0.1);

// Screen-space label size must remain stable across the zoom range instead of
// growing again after the minimum scale floor is reached. Allow a small
// tolerance for floating-point arithmetic while checking the actual policy.
for (const zoom of [1.2, 2, 2.8, 3.6, 5, 8, 12]) {
  const style = getCityVisualStyle(cities[0], zoom);
  assert.ok(style.fontSize * zoom <= 0.42, `City label grew in screen-space at zoom ${zoom}`);
}
assert.ok(ANATOLIA_PHYSICAL_ATLAS.lakes.length >= 8);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.rivers.length >= 10);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.labels.filter((label) => label.kind === "sea").every((label) => label.maxZoom >= 8));

const regionalStroke = getPhysicalStrokeProfile(1.3);
const detailedStroke = getPhysicalStrokeProfile(4);
assert.ok(detailedStroke.river > regionalStroke.river, "Detailed rivers should remain visually legible");
assert.ok(detailedStroke.lake > 0, "Detailed lakes need a visible outline");

for (const id of ["konstantinopolis", "iznik", "bursa", "ankara", "konya", "kayseri", "sivas", "trabzon", "erzurum"]) {
  assert.ok(ANATOLIA_CITY_ATLAS[id], `Missing historical city atlas entry: ${id}`);
}
console.log(`Cartography foundation tests passed: ${cities.length} cities, ${ANATOLIA_PHYSICAL_ATLAS.rivers.length} rivers, ${ANATOLIA_PHYSICAL_ATLAS.lakes.length} lakes, deterministic labels across 5 zoom levels.`);
