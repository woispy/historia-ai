import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { getCityLabelBudget, getCityMarkerBudget, getCityVisualStyle, layoutCityLabels, boxesOverlap } from "../../src/map/rendering/city/CityLabelLayout.js";
import { getMapLod, getPhysicalPresentation, getPhysicalStrokeProfile, shouldUseGpuProvinceFill } from "../../src/map/rendering/CartographyModel.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
assert.equal(getMapLod(1), "world");
assert.equal(getMapLod(2.8), "city");
assert.equal(getMapLod(8), "detailed");
assert.equal(shouldUseGpuProvinceFill(1), true);
assert.equal(shouldUseGpuProvinceFill(1.75), true);
assert.equal(shouldUseGpuProvinceFill(1.85), false);

for (const zoom of [1, 1.5, 2, 3, 4, 8, 16]) {
  const labels = layoutCityLabels(cities, zoom);
  assert.ok(labels.length <= getCityLabelBudget(zoom));
  for (let index = 0; index < labels.length; index += 1) {
    const left = labels[index];
    const leftWidth = Math.max(left.effectiveFontSize * 1.9, left.city.map.name.length * left.effectiveFontSize * 0.48);
    const leftBox = { left: left.anchor === "start" ? left.x : left.anchor === "end" ? left.x - leftWidth : left.x - leftWidth / 2, right: left.anchor === "start" ? left.x + leftWidth : left.anchor === "end" ? left.x : left.x + leftWidth / 2, top: left.y - left.effectiveFontSize * 0.78, bottom: left.y + left.effectiveFontSize * 0.24 };
    for (let rightIndex = index + 1; rightIndex < labels.length; rightIndex += 1) {
      const right = labels[rightIndex];
      const rightWidth = Math.max(right.effectiveFontSize * 1.9, right.city.map.name.length * right.effectiveFontSize * 0.48);
      const rightBox = { left: right.anchor === "start" ? right.x : right.anchor === "end" ? right.x - rightWidth : right.x - rightWidth / 2, right: right.anchor === "start" ? right.x + rightWidth : right.anchor === "end" ? right.x : right.x + rightWidth / 2, top: right.y - right.effectiveFontSize * 0.78, bottom: right.y + right.effectiveFontSize * 0.24 };
      assert.equal(boxesOverlap(leftBox, rightBox, 0.08), false, `label collision at zoom ${zoom}`);
    }
  }
  const secondPass = layoutCityLabels(cities, zoom);
  assert.deepEqual(labels.map(({ city, x, y, anchor, fontSize, screenScale }) => [city.id, x, y, anchor, fontSize, screenScale]), secondPass.map(({ city, x, y, anchor, fontSize, screenScale }) => [city.id, x, y, anchor, fontSize, screenScale]));
  const capital = cities.find((city) => city.map.tier === "capital");
  const style = getCityVisualStyle(capital, zoom);
  assert.ok(style.fontSize >= 0.045);
  assert.ok(style.screenSize > 0);
  assert.ok(style.screenRadius > 0);
  assert.ok(getCityMarkerBudget(zoom) >= getCityLabelBudget(zoom));
}

const capital = cities.find((city) => city.map.tier === "capital");
const zoom2Style = getCityVisualStyle(capital, 2);
const zoom8Style = getCityVisualStyle(capital, 8);
assert.ok(Math.abs(zoom2Style.screenSize - zoom8Style.screenSize) < 1e-9);
assert.ok(Math.abs(zoom2Style.screenRadius - zoom8Style.screenRadius) < 1e-9);
for (const zoom of [1.2, 2, 2.8, 3.6, 5, 8, 12, 16]) {
  const style = getCityVisualStyle(capital, zoom);
  assert.ok(style.screenSize <= 0.42, `City label grew in screen-space at zoom ${zoom}`);
  assert.ok(style.screenRadius <= 0.127, `City marker grew in screen-space at zoom ${zoom}`);
}

const focusedCamera = { x: 31.5, y: 39.4, zoom: 4.0 };
const focusedLabels = layoutCityLabels(cities, focusedCamera.zoom, focusedCamera);
const viewWidth = 360 / focusedCamera.zoom, viewHeight = 180 / focusedCamera.zoom;
const minX = focusedCamera.x - viewWidth / 2, maxX = focusedCamera.x + viewWidth / 2, minY = focusedCamera.y - viewHeight / 2, maxY = focusedCamera.y + viewHeight / 2;
for (const label of focusedLabels) {
  const width = Math.max(label.effectiveFontSize * 1.9, label.city.map.name.length * label.effectiveFontSize * 0.48);
  const left = label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - width / 2;
  const right = label.anchor === "start" ? label.x + width : label.anchor === "end" ? label.x : label.x + width / 2;
  const top = label.y - label.effectiveFontSize * 0.78, bottom = label.y + label.effectiveFontSize * 0.24;
  assert.ok(left >= minX && right <= maxX, `label clipped horizontally: ${label.city.id}`);
  assert.ok(top >= minY && bottom <= maxY, `label clipped vertically: ${label.city.id}`);
}

for (const zoom of [1.5, 2, 3, 4, 8]) {
  const presentation = getPhysicalPresentation(zoom), stroke = getPhysicalStrokeProfile(zoom);
  assert.ok(presentation.riverOpacity > 0);
  assert.ok(presentation.lakeOpacity > 0);
  assert.ok(stroke.river > stroke.minorRiver);
  assert.ok(stroke.mountain > stroke.minorMountain);
}
for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
  assert.ok(Array.isArray(lake.rings) && lake.rings.length > 0, `${lake.name} needs polygon rings`);
  for (const ring of lake.rings) {
    assert.ok(Array.isArray(ring) && ring.length >= 4, `${lake.name} needs enough control points for smoothing`);
    assert.ok(new Set(ring.map(([x, y]) => `${x},${y}`)).size >= 3, `${lake.name} has a degenerate ring`);
  }
}
for (const river of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers) assert.ok(river.coordinates.length >= 3, `${river.name} needs a continuous path`);
console.log(`Cartography visual regression tests passed: ${cities.length} cities, ${ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers.length} rivers, ${ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length} lakes, deterministic collision-safe labels across 7 zoom levels.`);