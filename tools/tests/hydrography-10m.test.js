import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pointInPolygon } from "../../src/map/rendering/physical/PhysicalGeometryValidation.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";

const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
const generatedPath = path.resolve("src/map/data/generated/anatolia-hydrography-10m.json");
const generated = JSON.parse(await readFile(generatedPath, "utf8"));
const lakes = generated.lakes;
const rivers = generated.rivers;

assert.equal(atlas.hydrography.projection, "EPSG:4326");
assert.match(atlas.hydrography.source, /Natural Earth 10m/);
assert.equal(atlas.lakes.length, 0, "Runtime atlas must not eagerly import lake geometry.");
assert.equal(atlas.rivers.length, 0, "Runtime atlas must not eagerly import river geometry.");
assert.ok(lakes.length > 8, "The 10m dataset must contain more lake geometry than the curated legacy set.");
assert.ok(rivers.length > 10, "The 10m dataset must contain more river geometry than the curated legacy set.");

for (const lake of lakes) {
  assert.equal(lake.geometrySource, "natural-earth-10m");
  assert.ok(Array.isArray(lake.rings) && lake.rings.length > 0, `${lake.name} must retain polygon rings.`);
  assert.ok(lake.rings[0].length >= 4, `${lake.name} geometry must retain valid polygon topology.`);
  assert.deepEqual(lake.rings[0][0], lake.rings[0].at(-1), `${lake.name} outer shoreline ring must be closed.`);
  assert.ok(Array.isArray(lake.bounds) && lake.bounds.length === 4);
}

for (const river of rivers) {
  assert.equal(river.geometrySource, "natural-earth-10m");
  assert.ok(Array.isArray(river.coordinates) && river.coordinates.length >= 2, `${river.name} must retain a line geometry.`);
  assert.ok(Array.isArray(river.bounds) && river.bounds.length === 4);
}

function normalized(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const riverNames = rivers.map((river) => normalized(`${river.name} ${river.nameEn}`));
for (const required of ["sakarya", "gediz", "buyukmenderes", "seyhan", "ceyhan", "firat", "dicle"]) {
  assert.ok(riverNames.some((name) => name.includes(required)), `Missing source-native 10m river geometry containing: ${required}`);
}

const documentedNaturalEarthRiverGaps = new Set(["kizilirmak", "yesilirmak"]);
assert.deepEqual([...documentedNaturalEarthRiverGaps].sort(), ["kizilirmak", "yesilirmak"]);

const documentedNaturalEarthLakeGaps = new Set(["sapanca"]);
assert.deepEqual([...documentedNaturalEarthLakeGaps], ["sapanca"]);

const requiredLakeAnchors = [
  ["Van Gölü", [43.00, 38.50]],
  ["Tuz Gölü", [33.40, 38.75]],
  ["İznik Gölü", [29.55, 40.43]],
  ["Beyşehir Gölü", [31.5033, 37.7946]],
  ["Eğirdir Gölü", [30.86, 38.00]],
];

for (const [name, anchor] of requiredLakeAnchors) {
  const containingLake = lakes.find((lake) => pointInPolygon(anchor, lake.rings[0]));
  assert.ok(containingLake, `${name} must have a Natural Earth 10m lake polygon containing its physical anchor.`);
  assert.ok(containingLake.rings[0].length >= 4, `${name} must retain valid shoreline topology.`);
}

const van = lakes.find((lake) => pointInPolygon([43.00, 38.50], lake.rings[0]));
assert.ok(van, "Van Gölü must be represented by Natural Earth 10m geometry.");

const sakaryaSegments = rivers.filter((river) => normalized(`${river.name} ${river.nameEn}`).includes("sakarya"));
assert.ok(sakaryaSegments.some((river) => river.coordinates.length >= 20), "Sakarya must retain a genuinely sampled river centerline.");

console.log(`Natural Earth 10m hydrography passed: ${lakes.length} lake polygons, ${rivers.length} river segments.`);
