import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInWater(point) {
  const seaWater = ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    && !pointInLand(point);
  const lakeWater = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => (
    (lake.rings ?? [lake.coordinates]).some((ring) => pointInPolygon(point, ring))
  ));
  return seaWater || lakeWater;
}

assert.equal(ANATOLIA_PROVINCE_METADATA.length, 44);

const ids = new Set();
const failedLandAnchors = [];
for (const province of ANATOLIA_PROVINCE_METADATA) {
  assert.equal(ids.has(province.id), false, `${province.id} must have a unique id`);
  ids.add(province.id);
  const onLand = pointInLand(province.centroid);
  if (!onLand) failedLandAnchors.push({ id: province.id, centroid: province.centroid });
  assert.equal(onLand, true, `${province.id} cartographic centroid must remain on land`);
  assert.equal(pointInWater(province.centroid), false, `${province.id} cartographic centroid must not fall in water`);
}

assert.deepEqual(failedLandAnchors, [], "all 44 cartographic anchors must resolve inside the physical Anatolia land mask");

const aegean = ANATOLIA_PROVINCE_METADATA
  .filter((province) => province.regionId === "aegean-west")
  .map((province) => province.centroid);
assert.ok(aegean.length >= 4, "Aegean western reconstruction needs its historical anchor set");

for (let first = 0; first < aegean.length; first += 1) {
  for (let second = first + 1; second < aegean.length; second += 1) {
    const dx = aegean[first][0] - aegean[second][0];
    const dy = aegean[first][1] - aegean[second][1];
    assert.ok(dx * dx + dy * dy > 0.01, "Aegean anchors must not collapse into micro-cell clusters");
  }
}

const byId = new Map(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, province]));
assert.deepEqual(byId.get("ionia-ayasuluk")?.centroid, [27.37, 37.95], "Ayasuluk anchor must follow the historical Selçuk/Ephesus location rather than an inland drift");
assert.deepEqual(byId.get("lydia-birgi")?.centroid, [28.06, 38.25], "Birgi anchor must remain in its historical mountain-valley corridor");
assert.deepEqual(byId.get("caria-tralleis")?.centroid, [27.84, 37.86], "Tralleis anchor must remain in the Maeander interior rather than the coast");
assert.deepEqual(byId.get("caria-halikarnassos")?.centroid, [27.43, 37.03], "Halikarnassos anchor must remain on the southwest Carian coast");
assert.deepEqual(byId.get("bithynia-nicomedia")?.centroid, [29.9169, 40.7654], "Nicomedia anchor must remain tied to the historical city atlas location");

const uniqueCentroids = new Set(
  ANATOLIA_PROVINCE_METADATA.map((province) => province.centroid.map((value) => value.toFixed(4)).join(":")),
);
assert.equal(uniqueCentroids.size, ANATOLIA_PROVINCE_METADATA.length, "cartographic anchors must remain unique");

console.log(`Anatolia province cartography tests passed: ${ANATOLIA_PROVINCE_METADATA.length} land-safe geographic anchors.`);
