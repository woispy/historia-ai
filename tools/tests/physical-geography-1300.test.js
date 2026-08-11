import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";

const { bbox, landPolygons, coastlines, islands, seas, lakes, rivers, mountainRanges, terrainRegions, labels } = ANATOLIA_PHYSICAL_ATLAS;
const [minLon, minLat, maxLon, maxLat] = bbox;

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

assert.equal(ANATOLIA_PHYSICAL_ATLAS.version, 1);
assert.equal(ANATOLIA_PHYSICAL_ATLAS.projection ?? "EPSG:4326", "EPSG:4326");
assert.equal(landPolygons.length, 1);
assert.ok(landPolygons[0].length >= 100, "The Anatolian land mask must retain detailed coastline sampling.");
assert.ok(coastlines.length >= 3);
assert.ok(islands.length >= 5);
assert.ok(seas.length >= 6);
assert.ok(lakes.length >= 8);
assert.ok(rivers.length >= 10);
assert.ok(mountainRanges.length >= 6);
assert.ok(terrainRegions.length >= 3);
assert.ok(labels.length >= 6);

for (const polygon of landPolygons) {
  assertCoordinates("land polygon", polygon);
  assert.deepEqual(polygon[0], polygon.at(-1), "Land polygon must be closed.");
}

for (const collection of [coastlines, islands, seas, lakes, rivers, mountainRanges, terrainRegions]) {
  const names = new Set();
  for (const feature of collection) {
    assert.ok(feature.name, "Every physical feature needs a stable human-readable name.");
    assert.ok(!names.has(feature.name), `Duplicate feature name: ${feature.name}`);
    names.add(feature.name);
    assertCoordinates(feature.name, feature.coordinates);
  }
}

const requiredRivers = ["Sakarya", "Kızılırmak", "Yeşilırmak", "Gediz", "Büyük Menderes", "Seyhan", "Ceyhan", "Fırat", "Dicle"];
for (const riverName of requiredRivers) {
  assert.ok(rivers.some((river) => river.name === riverName), `Missing major river: ${riverName}`);
}

const requiredLakes = ["İznik Lake", "Sapanca Lake", "Beyşehir Lake", "Eğirdir Lake", "Tuz Lake", "Van Lake"];
for (const lakeName of requiredLakes) {
  assert.ok(lakes.some((lake) => lake.name === lakeName), `Missing major lake: ${lakeName}`);
}

const requiredRanges = ["Pontic Mountains", "Western Taurus", "Central Taurus", "Eastern Taurus", "Anti-Taurus"];
for (const rangeName of requiredRanges) {
  assert.ok(mountainRanges.some((range) => range.name === rangeName), `Missing mountain system: ${rangeName}`);
}

assert.ok(seas.some((sea) => sea.name === "Marmara Sea"), "Marmara Sea must be a first-class physical feature.");
assert.ok(seas.some((sea) => sea.name === "Gulf of İzmit"), "Gulf of İzmit must be represented.");
assert.ok(seas.some((sea) => sea.name === "Gulf of İzmir"), "Gulf of İzmir must be represented.");
assert.ok(seas.some((sea) => sea.name === "Antalya Gulf"), "Antalya Gulf must be represented.");

const labelIds = new Set(labels.map((label) => label.id));
assert.equal(labelIds.size, labels.length, "Physical labels need unique ids.");
assert.ok(labels.every((label) => Number.isFinite(label.x) && Number.isFinite(label.y)));

console.log(`Physical geography tests passed: ${coastlines.length} coastline segments, ${rivers.length} rivers, ${lakes.length} lakes, ${mountainRanges.length} mountain systems.`);
