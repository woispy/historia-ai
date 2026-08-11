import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { estimatePhysicalLabelBox, layoutPhysicalLabels } from "../../src/map/rendering/physical/PhysicalLabelLayout.js";

const atlas = ANATOLIA_PHYSICAL_ATLAS;
const [minLon, minLat, maxLon, maxLat] = atlas.bbox;

function assertCoordinates(name, coordinates) {
  assert.ok(Array.isArray(coordinates), `${name} coordinates must be an array`);
  assert.ok(coordinates.length >= 2, `${name} must have at least two coordinates`);
  for (const point of coordinates) {
    assert.equal(point.length, 2, `${name} contains a malformed coordinate`);
    const [lon, lat] = point;
    assert.ok(Number.isFinite(lon) && Number.isFinite(lat), `${name} contains a non-numeric coordinate`);
    assert.ok(lon >= minLon - 2 && lon <= maxLon + 2, `${name} longitude is outside the atlas envelope`);
    assert.ok(lat >= minLat - 2 && lat <= maxLat + 2, `${name} latitude is outside the atlas envelope`);
  }
}

assert.equal(atlas.version, 2);
assert.equal(atlas.projection, "EPSG:4326");
assert.equal(atlas.landPolygons.length, 1);
assert.ok(atlas.landPolygons[0].length >= 100, "The land mask must retain detailed coastline sampling.");
assert.ok(atlas.seas.length >= 8);
assert.ok(atlas.channels.length >= 2);
assert.ok(atlas.islands.length >= 8);
assert.ok(atlas.lakes.length >= 8);
assert.ok(atlas.rivers.length >= 10);
assert.ok(atlas.mountainRanges.length >= 6);
assert.ok(atlas.terrainRegions.length >= 3);
assert.ok(atlas.labels.length >= 7);

for (const polygon of atlas.landPolygons) {
  assertCoordinates("land polygon", polygon);
  assert.deepEqual(polygon[0], polygon.at(-1), "Land polygon must be closed.");
}

for (const collection of [atlas.seas, atlas.channels, atlas.islands, atlas.lakes, atlas.rivers, atlas.mountainRanges, atlas.terrainRegions]) {
  const names = new Set();
  for (const feature of collection) {
    assert.ok(feature.name, "Every physical feature needs a stable name.");
    assert.ok(!names.has(feature.name), `Duplicate feature name: ${feature.name}`);
    names.add(feature.name);
    assertCoordinates(feature.name, feature.coordinates);
  }
}

const requiredSeas = ["Black Sea", "Marmara Sea", "Aegean Sea", "Mediterranean Sea", "Gulf of İzmit", "Gulf of İzmir", "Antalya Gulf"];
for (const name of requiredSeas) {
  assert.ok(atlas.seas.some((sea) => sea.name === name), `Missing major water body: ${name}`);
}

const requiredRivers = ["Sakarya", "Kızılırmak", "Yeşilırmak", "Gediz", "Büyük Menderes", "Seyhan", "Ceyhan", "Fırat", "Dicle"];
for (const name of requiredRivers) {
  assert.ok(atlas.rivers.some((river) => river.name === name), `Missing major river: ${name}`);
}

const requiredLakes = ["İznik Lake", "Sapanca Lake", "Beyşehir Lake", "Eğirdir Lake", "Tuz Lake", "Van Lake"];
for (const name of requiredLakes) {
  assert.ok(atlas.lakes.some((lake) => lake.name === name), `Missing major lake: ${name}`);
}

const requiredRanges = ["Pontic Mountains", "Western Taurus", "Central Taurus", "Eastern Taurus", "Anti-Taurus"];
for (const name of requiredRanges) {
  assert.ok(atlas.mountainRanges.some((range) => range.name === name), `Missing mountain system: ${name}`);
}

const labelIds = new Set(atlas.labels.map((label) => label.id));
assert.equal(labelIds.size, atlas.labels.length, "Physical labels need unique ids.");
assert.ok(atlas.labels.every((label) => Number.isFinite(label.x) && Number.isFinite(label.y)));

const seaLabels = atlas.labels.filter((label) => label.kind === "sea");
assert.equal(seaLabels.length, 4, "The four primary sea labels must remain first-class.");
for (const label of seaLabels) {
  const box = estimatePhysicalLabelBox(label);
  assert.ok(box.minX >= label.bounds[0] || box.maxX <= label.bounds[2], `${label.name} must have a valid label region.`);
}

const zoomOne = layoutPhysicalLabels(atlas.labels, 1);
assert.equal(zoomOne.filter((label) => label.kind === "sea").length, 4, "All primary sea labels must be visible at overview zoom.");
assert.equal(zoomOne.filter((label) => label.kind === "region").length, 0, "Regional labels must stay hidden at overview zoom.");

const zoomThree = layoutPhysicalLabels(atlas.labels, 3);
assert.ok(zoomThree.some((label) => label.id === "region-central"), "Regional labels should appear at closer zoom.");

for (let i = 0; i < zoomThree.length; i += 1) {
  for (let j = i + 1; j < zoomThree.length; j += 1) {
    const a = estimatePhysicalLabelBox(zoomThree[i]);
    const b = estimatePhysicalLabelBox(zoomThree[j]);
    const overlap = !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
    assert.equal(overlap, false, `Physical labels overlap: ${zoomThree[i].name} / ${zoomThree[j].name}`);
  }
}

console.log(`Physical Geography 2.0 tests passed: ${atlas.seas.length} water bodies, ${atlas.rivers.length} rivers, ${atlas.lakes.length} lakes, ${atlas.mountainRanges.length} mountain systems.`);
