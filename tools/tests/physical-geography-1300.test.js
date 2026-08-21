import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANATOLIA_CITY_ATLAS, getAnatoliaCityMapMetadata } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { collectWorldLandPolygons } from "../../src/map/physical/WorldLandMask.js";
import { linearPathFromCoordinates, exactAreaPath } from "../../src/map/rendering/physical/PhysicalGeometryPath.js";
import { PHYSICAL_GEOMETRY_RULES, pointInPolygon, validateCityPhysicalPosition } from "../../src/map/rendering/physical/PhysicalGeometryValidation.js";
import { estimatePhysicalLabelBox, layoutPhysicalLabels } from "../../src/map/rendering/physical/PhysicalLabelLayout.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
const [minLon, minLat, maxLon, maxLat] = atlas.bbox;
const geometryDirectory = resolve(root, "src/world/map/assets/geometry");
const geometryFiles = readdirSync(geometryDirectory).filter((fileName) => /^geometry_country_.*\.json$/.test(fileName));
const generatedGeometryModules = Object.fromEntries(geometryFiles.map((fileName) => [fileName, { default: JSON.parse(readFileSync(resolve(geometryDirectory, fileName), "utf8")) }]));
const generatedWorldLandPolygons = collectWorldLandPolygons(generatedGeometryModules);
const cityLandPolygons = Object.freeze([...generatedWorldLandPolygons, ...atlas.landPolygons]);

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

function assertRing(name, ring) {
  assertCoordinates(name, ring);
  assert.ok(ring.length >= 4, `${name} must retain valid polygon topology.`);
  assert.deepEqual(ring[0], ring.at(-1), `${name} must be closed.`);
}

assert.equal(atlas.version, 2);
assert.equal(atlas.projection, "EPSG:4326");
assert.equal(atlas.landPolygons.length, 1);
assert.ok(atlas.landPolygons[0].length >= 100, "The regional land mask must retain detailed coastline sampling.");
assert.equal(geometryFiles.length, 242, "Natural Earth 50m geometry generation must produce the expected country asset set.");
assert.ok(generatedWorldLandPolygons.length > 0, "Generated Natural Earth land assets must be available before physical tests.");
assert.match(atlas.hydrography.source, /Natural Earth 10m/);
assert.equal(atlas.hydrography.projection, "EPSG:4326");
assert.ok(atlas.lakes.length > 8, "Generated 10m lake geometry must replace the curated legacy set.");
assert.ok(atlas.rivers.length > 10, "Generated 10m river geometry must replace the curated legacy set.");
assert.ok(atlas.seas.length >= 8);
assert.ok(atlas.channels.length >= 2);
assert.ok(atlas.islands.length >= 8);
assert.ok(atlas.mountainRanges.length >= 6);
assert.ok(atlas.terrainRegions.length >= 3);
assert.ok(atlas.labels.length >= 7);

for (const polygon of atlas.landPolygons) {
  assertCoordinates("land polygon", polygon);
  assert.deepEqual(polygon[0], polygon.at(-1), "Land polygon must be closed.");
}

for (const collection of [atlas.seas, atlas.channels, atlas.islands, atlas.mountainRanges, atlas.terrainRegions]) {
  const names = new Set();
  for (const feature of collection) {
    assert.ok(feature.name, "Every physical feature needs a stable name.");
    assert.ok(!names.has(feature.name), `Duplicate feature name: ${feature.name}`);
    names.add(feature.name);
    assertCoordinates(feature.name, feature.coordinates);
  }
}

for (const lake of atlas.lakes) {
  assert.equal(lake.geometrySource, "natural-earth-10m");
  assert.ok(Array.isArray(lake.rings) && lake.rings.length > 0, `${lake.name} must retain polygon rings.`);
  lake.rings.forEach((ring, index) => assertRing(`${lake.name} ring ${index}`, ring));
  assert.ok(Array.isArray(lake.bounds) && lake.bounds.length === 4);
  const path = exactAreaPath(lake.rings);
  assert.equal((path.match(/Q/g) ?? []).length, 0, `${lake.name} must not be smoothed.`);
}

for (const river of atlas.rivers) {
  assert.equal(river.geometrySource, "natural-earth-10m");
  assert.ok(Array.isArray(river.coordinates) && river.coordinates.length >= 2, `${river.name} must retain a line geometry.`);
  assert.ok(Array.isArray(river.bounds) && river.bounds.length === 4);
  assert.equal(river.canonicalId === null || typeof river.canonicalId === "string", true);
  const path = linearPathFromCoordinates(river.coordinates);
  assert.equal((path.match(/Q/g) ?? []).length, 0, `${river.name} must not be smoothed.`);
}

const requiredSeas = ["Black Sea", "Marmara Sea", "Aegean Sea", "Mediterranean Sea", "Gulf of İzmit", "Gulf of İzmir", "Antalya Gulf"];
for (const name of requiredSeas) assert.ok(atlas.seas.some((sea) => sea.name === name), `Missing major water body: ${name}`);

const riverCanonicalIds = new Set(atlas.rivers.map((river) => river.canonicalId).filter(Boolean));
const sourceNativeRequiredRiverIds = ["sakarya", "gediz", "buyuk-menderes", "seyhan", "ceyhan", "firat", "dicle"];
for (const required of sourceNativeRequiredRiverIds) assert.equal(riverCanonicalIds.has(required), true, `Missing source-native 10m river identity: ${required}`);

// Natural Earth 10m does not publish every major Anatolian river.
// Keep these gaps explicit until a reproducible supplemental GIS source is added.
const documentedNaturalEarthRiverGaps = new Set(["kizilirmak", "yesilirmak"]);
assert.deepEqual([...documentedNaturalEarthRiverGaps].sort(), ["kizilirmak", "yesilirmak"]);

// Natural Earth 10m also misses some important local/regional lakes. Sapanca is
// intentionally tracked here rather than represented by invented geometry.
const documentedNaturalEarthLakeGaps = new Set(["sapanca"]);
assert.deepEqual([...documentedNaturalEarthLakeGaps], ["sapanca"]);

// Anchors are deliberately placed well inside each lake rather than on the shoreline.
const requiredLakeAnchors = [
  ["Van Gölü", [43.00, 38.50]],
  ["Tuz Gölü", [33.40, 38.75]],
  ["İznik Gölü", [29.55, 40.43]],
  ["Beyşehir Gölü", [31.5033, 37.7946]],
  ["Eğirdir Gölü", [30.86, 38.00]],
];

for (const [name, anchor] of requiredLakeAnchors) {
  const containingLake = atlas.lakes.find((lake) => pointInPolygon(anchor, lake.rings[0]));
  assert.ok(containingLake, `${name} must have a Natural Earth 10m lake polygon containing its physical anchor.`);
  assert.ok(containingLake.rings[0].length >= 4, `${name} must retain valid shoreline topology.`);
}

const van = atlas.lakes.find((lake) => pointInPolygon([43.00, 38.50], lake.rings[0]));
assert.ok(van, "Van Gölü must be represented by Natural Earth 10m geometry.");

const sakaryaSegments = atlas.rivers.filter((river) => river.canonicalId === "sakarya");
assert.ok(sakaryaSegments.some((river) => river.coordinates.length >= 20), "Sakarya must retain a genuinely sampled river centerline.");

const requiredRanges = ["Pontic Mountains", "Western Taurus", "Central Taurus", "Eastern Taurus", "Anti-Taurus"];
for (const name of requiredRanges) assert.ok(atlas.mountainRanges.some((range) => range.name === name), `Missing mountain system: ${name}`);

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

for (const [cityId, city] of Object.entries(ANATOLIA_CITY_ATLAS)) {
  const result = validateCityPhysicalPosition(city, cityLandPolygons, atlas.lakes);
  assert.equal(result.onLand, true, `${cityId} must remain on physical land.`);
  assert.equal(result.valid, true, `${cityId} must not be inside a lake interior.`);
  assert.deepEqual(getAnatoliaCityMapMetadata(cityId), city);
}

const syntheticLand = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]];
const syntheticLake = [{ name: "Synthetic Lake", coordinates: [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]] }];
const syntheticLakeWithHole = [{ name: "Synthetic Lake With Island", rings: [[[1, 1], [9, 1], [9, 9], [1, 9], [1, 1]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]] }];
assert.equal(validateCityPhysicalPosition({ x: 2, y: 2 }, syntheticLand, syntheticLake).valid, true);
assert.equal(validateCityPhysicalPosition({ x: 5, y: 5 }, syntheticLand, syntheticLake).valid, false, "A city in the lake interior must be rejected.");
assert.equal(validateCityPhysicalPosition({ x: 3, y: 3 }, syntheticLand, syntheticLakeWithHole).valid, false, "A city in the lake outer ring must be rejected.");
assert.equal(validateCityPhysicalPosition({ x: 5, y: 5 }, syntheticLand, syntheticLakeWithHole).valid, true, "A city on a lake island must remain valid.");
assert.ok(PHYSICAL_GEOMETRY_RULES.shorelineToleranceDegrees > 0);

console.log(`Physical Geography 2.0 / P0 tests passed: ${atlas.seas.length} water bodies, ${atlas.rivers.length} Natural Earth 10m river segments, ${atlas.lakes.length} Natural Earth 10m lake polygons, ${atlas.mountainRanges.length} mountain systems, ${Object.keys(ANATOLIA_CITY_ATLAS).length} validated city anchors.`);
