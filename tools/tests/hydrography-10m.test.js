import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { pointInPolygon } from "../../src/map/rendering/physical/PhysicalGeometryValidation.js";

const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
const hydrography = atlas.hydrography;

assert.equal(hydrography.projection, "EPSG:4326");
assert.match(hydrography.source, /Natural Earth 10m/);
assert.ok(atlas.lakes.length > 8, "The 10m atlas must contain more lake geometry than the curated legacy set.");
assert.ok(atlas.rivers.length > 10, "The 10m atlas must contain more river geometry than the curated legacy set.");

for (const lake of atlas.lakes) {
  assert.equal(lake.geometrySource, "natural-earth-10m");
  assert.ok(Array.isArray(lake.rings) && lake.rings.length > 0, `${lake.name} must retain polygon rings.`);
  assert.ok(lake.rings[0].length >= 4, `${lake.name} geometry must retain valid polygon topology.`);
  assert.deepEqual(lake.rings[0][0], lake.rings[0].at(-1), `${lake.name} outer shoreline ring must be closed.`);
  assert.ok(Array.isArray(lake.bounds) && lake.bounds.length === 4);
}

for (const river of atlas.rivers) {
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

const riverNames = atlas.rivers.map((river) => normalized(`${river.name} ${river.nameEn}`));
for (const required of ["sakarya", "kizilirmak", "yesilirmak", "gediz", "buyukmenderes", "seyhan", "ceyhan", "firat", "dicle"]) {
  assert.ok(riverNames.some((name) => name.includes(required)), `Missing 10m river geometry containing: ${required}`);
}

// Anchors are deliberately placed well inside each lake rather than on the shoreline.
const requiredLakeAnchors = [
  ["Van Gölü", [43.00, 38.50]],
  ["Tuz Gölü", [33.40, 38.75]],
  ["İznik Gölü", [29.55, 40.43]],
  ["Sapanca Gölü", [30.28, 40.70]],
  ["Beyşehir Gölü", [31.45, 37.73]],
  ["Eğirdir Gölü", [30.86, 38.00]],
];

for (const [name, anchor] of requiredLakeAnchors) {
  const containingLake = atlas.lakes.find((lake) => pointInPolygon(anchor, lake.rings[0]));
  assert.ok(containingLake, `${name} must have a Natural Earth 10m lake polygon containing its physical anchor.`);
  assert.ok(containingLake.rings[0].length >= 4, `${name} must retain valid shoreline topology.`);
}

const van = atlas.lakes.find((lake) => pointInPolygon([43.00, 38.50], lake.rings[0]));
assert.ok(van, "Van Gölü must be represented by Natural Earth 10m geometry.");

const sakaryaSegments = atlas.rivers.filter((river) => normalized(`${river.name} ${river.nameEn}`).includes("sakarya"));
assert.ok(sakaryaSegments.some((river) => river.coordinates.length >= 20), "Sakarya must retain a genuinely sampled river centerline.");

console.log(`Natural Earth 10m hydrography passed: ${atlas.lakes.length} lake polygons, ${atlas.rivers.length} river segments.`);
