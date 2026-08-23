import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { applyAnatoliaProvinceCartographicOverrides } from "../../src/map/data/AnatoliaProvinceCartographicOverrides.js";

function pointOnSegment(point, start, end, epsilon = 1e-9) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > epsilon) return false;
  return x >= Math.min(x1, x2) - epsilon
    && x <= Math.max(x1, x2) + epsilon
    && y >= Math.min(y1, y2) - epsilon
    && y <= Math.max(y1, y2) + epsilon;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;

  // IMPORTANT: keep `previous` on the preceding vertex. The former
  // `previous = index += 1` update advanced both variables to the same index,
  // turning every tested edge into a zero-length segment and making every
  // valid anchor appear to be outside the land mask.
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    if (pointOnSegment(point, prior, current)) return true;
    const [xi, yi] = current;
    const [xj, yj] = prior;
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
    previous = index;
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

// Runtime construction applies the explicit cartographic anchors. Run the same
// operation in isolation here so this test validates the effective presentation
// geometry rather than the un-overridden source metadata object.
const effectiveMetadata = ANATOLIA_PROVINCE_METADATA.map((province) => ({
  ...province,
  centroid: [...province.centroid],
}));
applyAnatoliaProvinceCartographicOverrides(effectiveMetadata);

const ids = new Set();
const failedLandAnchors = [];
for (const province of effectiveMetadata) {
  assert.equal(ids.has(province.id), false, `${province.id} must have a unique id`);
  ids.add(province.id);
  const onLand = pointInLand(province.centroid);
  if (!onLand) failedLandAnchors.push({ id: province.id, centroid: province.centroid });
  assert.equal(onLand, true, `${province.id} cartographic centroid must remain on land`);
  assert.equal(pointInWater(province.centroid), false, `${province.id} cartographic centroid must not fall in water`);
}

assert.deepEqual(failedLandAnchors, [], "all 44 cartographic anchors must resolve inside the physical Anatolia land mask");

const aegean = effectiveMetadata
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

const byId = new Map(effectiveMetadata.map((province) => [province.id, province]));
assert.deepEqual(byId.get("ionia-ayasuluk")?.centroid, [27.37, 37.95], "Ayasuluk anchor must follow the historical Selçuk/Ephesus location rather than an inland drift");
assert.deepEqual(byId.get("lydia-birgi")?.centroid, [28.20, 38.20], "Birgi anchor must remain in its historical mountain-valley corridor");
assert.deepEqual(byId.get("caria-tralleis")?.centroid, [28.00, 37.90], "Tralleis anchor must remain in the Maeander interior rather than the coast");
assert.deepEqual(byId.get("caria-halikarnassos")?.centroid, [27.43, 37.04], "Halikarnassos anchor must remain on the southwest Carian coast");
assert.deepEqual(byId.get("bithynia-nicomedia")?.centroid, [29.9169, 40.7654], "Nicomedia anchor must remain tied to the historical city atlas location");

const uniqueCentroids = new Set(
  effectiveMetadata.map((province) => province.centroid.map((value) => value.toFixed(4)).join(":")),
);
assert.equal(uniqueCentroids.size, effectiveMetadata.length, "cartographic anchors must remain unique");

console.log(`Anatolia province cartography tests passed: ${effectiveMetadata.length} land-safe geographic anchors.`);