import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import {
  getCityLabelBudget,
  getCityMarkerBudget,
  getCityVisualStyle,
  layoutCityLabels,
  boxesOverlap,
} from "../../src/map/rendering/city/CityLabelLayout.js";
import {
  getMapLod,
  getPhysicalPresentation,
  getPhysicalStrokeProfile,
  shouldUseGpuProvinceFill,
} from "../../src/map/rendering/CartographyModel.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));

assert.equal(getMapLod(1), "world");
assert.equal(getMapLod(2.8), "city");
assert.equal(getMapLod(8), "detailed");

// The political surface stays on the GPU through normal navigation. The
// vector fill only takes over at deep zoom where its geometric fidelity is
// useful, preventing a visible map swap while zooming.
assert.equal(shouldUseGpuProvinceFill(1), true);
assert.equal(shouldUseGpuProvinceFill(1.75), true);
assert.equal(shouldUseGpuProvinceFill(1.85), true);
assert.equal(shouldUseGpuProvinceFill(3.35), true);
assert.equal(shouldUseGpuProvinceFill(4.5), false);

for (const zoom of [1, 1.5, 2, 3, 4, 8, 16]) {
  const labels = layoutCityLabels(cities, zoom);
  assert.ok(labels.length <= getCityLabelBudget(zoom));

  for (let index = 0; index < labels.length; index += 1) {
    const left = labels[index];
    const leftWidth = Math.max(left.fontSize * 1.9, left.city.map.name.length * left.fontSize * 0.48);
    const leftBox = {
      left: left.anchor === "start" ? left.x : left.anchor === "end" ? left.x - leftWidth : left.x - leftWidth / 2,
      right: left.anchor === "start" ? left.x + leftWidth : left.anchor === "end" ? left.x : left.x + leftWidth / 2,
      top: left.y - left.fontSize * 0.78,
      bottom: left.y + left.fontSize * 0.24,
    };

    for (let rightIndex = index + 1; rightIndex < labels.length; rightIndex += 1) {
      const right = labels[rightIndex];
      const rightWidth = Math.max(right.fontSize * 1.9, right.city.map.name.length * right.fontSize * 0.48);
      const rightBox = {
        left: right.anchor === "start" ? right.x : right.anchor === "end" ? right.x - rightWidth : right.x - rightWidth / 2,
        right: right.anchor === "start" ? right.x + rightWidth : right.anchor === "end" ? right.x : right.x + rightWidth / 2,
        top: right.y - right.fontSize * 0.78,
        bottom: right.y + right.fontSize * 0.24,
      };
      assert.equal(boxesOverlap(leftBox, rightBox, 0.08), false, `label collision at zoom ${zoom}`);
    }
  }

  const secondPass = layoutCityLabels(cities, zoom);
  assert.deepEqual(
    labels.map(({ city, x, y, anchor, fontSize }) => [city.id, x, y, anchor, fontSize]),
    secondPass.map(({ city, x, y, anchor, fontSize }) => [city.id, x, y, anchor, fontSize]),
  );

  const capital = cities.find((city) => city.map.tier === "capital");
  assert.ok(getCityVisualStyle(capital, zoom).fontSize >= 0.045);
  assert.ok(getCityMarkerBudget(zoom) >= getCityLabelBudget(zoom));
}

// The SVG viewBox changes world-space pixels per unit with zoom. The visual
// style must compensate for that so labels and markers do not grow with every
// deep zoom step.
const capital = cities.find((city) => city.map.tier === "capital");
const zoom2Style = getCityVisualStyle(capital, 2);
const zoom8Style = getCityVisualStyle(capital, 8);
assert.ok(Math.abs((zoom2Style.fontSize * 2) - (zoom8Style.fontSize * 8)) < 1e-9);
assert.ok(Math.abs((zoom2Style.radius * 2) - (zoom8Style.radius * 8)) < 1e-9);

// Focused cameras must not return labels whose boxes would be clipped by the
// visible world-space viewport. This prevents edge-cut typography.
const focusedCamera = { x: 31.5, y: 39.4, zoom: 4.0 };
const focusedLabels = layoutCityLabels(cities, focusedCamera.zoom, focusedCamera);
const viewWidth = 360 / focusedCamera.zoom;
const viewHeight = 180 / focusedCamera.zoom;
const minX = focusedCamera.x - viewWidth / 2;
const maxX = focusedCamera.x + viewWidth / 2;
const minY = focusedCamera.y - viewHeight / 2;
const maxY = focusedCamera.y + viewHeight / 2;
for (const label of focusedLabels) {
  const width = Math.max(label.fontSize * 1.9, label.city.map.name.length * label.fontSize * 0.48);
  const left = label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - width / 2;
  const right = label.anchor === "start" ? label.x + width : label.anchor === "end" ? label.x : label.x + width / 2;
  const top = label.y - label.fontSize * 0.78;
  const bottom = label.y + label.fontSize * 0.24;
  assert.ok(left >= minX && right <= maxX, `label clipped horizontally: ${label.city.id}`);
  assert.ok(top >= minY && bottom <= maxY, `label clipped vertically: ${label.city.id}`);
}

for (const zoom of [1.5, 2, 3, 4, 8]) {
  const presentation = getPhysicalPresentation(zoom);
  const stroke = getPhysicalStrokeProfile(zoom);
  assert.ok(presentation.riverOpacity > 0);
  assert.ok(presentation.lakeOpacity > 0);
  assert.ok(stroke.river > stroke.minorRiver);
  assert.ok(stroke.mountain > stroke.minorMountain);
}

for (const lake of ANATOLIA_PHYSICAL_ATLAS.lakes) {
  assert.ok(lake.coordinates.length >= 6, `${lake.name} needs enough control points for smoothing`);
  assert.ok(new Set(lake.coordinates.map(([x, y]) => `${x},${y}`)).size >= 5, `${lake.name} is degenerate`);
}

for (const river of ANATOLIA_PHYSICAL_ATLAS.rivers) {
  assert.ok(river.coordinates.length >= 3, `${river.name} needs a continuous path`);
}

console.log(`Cartography visual regression tests passed: ${cities.length} cities, ${ANATOLIA_PHYSICAL_ATLAS.rivers.length} rivers, ${ANATOLIA_PHYSICAL_ATLAS.lakes.length} lakes, deterministic collision-safe labels across 7 zoom levels.`);
