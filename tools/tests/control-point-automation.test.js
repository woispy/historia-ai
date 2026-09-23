/**
 * Historia AI — Control Point Automation contract test.
 *
 * Verifies the automated control point pipeline for georeferencing a real
 * historical map:
 *  1. Corner (+midpoint) control points derived deterministically from the
 *     declared extent.
 *  2. Exact affine fit from the extent for a north-up map.
 *  3. City-anchor sanity gate: anchors visible on the map validate inside
 *     the image; a WRONGLY-declared extent is detected fail-closed with
 *     per-anchor diagnostics.
 *  4. Real ANATOLIA_CITY_ATLAS anchors validate against an Anatolia extent;
 *     an extent that excludes northern Anatolia is caught automatically.
 *  5. autoCalibrate end-to-end: ready=true for a consistent extent,
 *     ready=false for an inconsistent one.
 */

import assert from "node:assert/strict";
import { deriveCornerControlPoints, fitFromExtent, validateGeoreference, autoCalibrate, solveExtentFromAnchorPixels, calibrateFromAnchorPixels } from "../../src/map/studio/ControlPointAutomation.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";

let passed = 0;

const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 600;
const MAP_WIDTH = 535;
const MAP_HEIGHT = 330;
// The real anatolia-1300 coverage envelope (fixture coverage.json bbox):
// Sinope sits at lat 42.023, so the extent must reach 42.35 to include it.
const ANATOLIA_EXTENT = { minX: 25.45, minY: 35.72, maxX: 44.85, maxY: 42.35 };

// Mapping a north-up map with this extent would use:
//   px = (lon - 25.45) / 19.4 * 800 ; py = (42.35 - lat) / 6.63 * 600
const toPixel = ([lon, lat]) => [((lon - 25.45) / (44.85 - 25.45)) * IMAGE_WIDTH, ((42.35 - lat) / (42.35 - 35.72)) * IMAGE_HEIGHT];

// 1. Corner control points: deterministic, correct corners.
const corners = deriveCornerControlPoints({ imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, extent: ANATOLIA_EXTENT });
assert.equal(corners.length, 4);
assert.deepEqual(corners[0], { pixel: [0, 0], geo: [25.45, 42.35] });
assert.deepEqual(corners[1], { pixel: [IMAGE_WIDTH, 0], geo: [44.85, 42.35] });
assert.deepEqual(corners[2], { pixel: [IMAGE_WIDTH, IMAGE_HEIGHT], geo: [44.85, 35.72] });
assert.deepEqual(corners[3], { pixel: [0, IMAGE_HEIGHT], geo: [25.45, 35.72] });
passed += 1;

// 1b. Midpoints add 5 more anchors.
const withMidpoints = deriveCornerControlPoints({ imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, extent: ANATOLIA_EXTENT, includeMidpoints: true });
assert.equal(withMidpoints.length, 9);
const midpoint = withMidpoints.find((point) => point.pixel[0] === IMAGE_WIDTH / 2 && point.pixel[1] === IMAGE_HEIGHT / 2);
assert.deepEqual(midpoint.geo, [35.15, 39.035]);
passed += 1;

// 2. Exact fit from the extent: pixel<->geo round-trip at the city positions.
const { georeferencer } = fitFromExtent({ imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, extent: ANATOLIA_EXTENT });
for (const [lon, lat] of [[28.9784, 41.0082], [39.72, 41.0], [30.5, 37.8]]) {
  const [px, py] = georeferencer.toPixel(lon, lat);
  const [glon, glat] = georeferencer.toGeo(px, py);
  assert.ok(Math.abs(glon - lon) < 1e-9 && Math.abs(glat - lat) < 1e-9, "extent fit round-trip");
  const [epx, epy] = toPixel([lon, lat]);
  assert.ok(Math.abs(px - epx) < 1e-9 && Math.abs(py - epy) < 1e-9, "fit must match the north-up mapping");
}
assert.ok(georeferencer.rmsResidual < 1e-9, "corner fit must be exact for a north-up map");
passed += 1;

// 3. City-anchor sanity gate: synthetic cities placed on the map validate.
const syntheticCities = [
  { id: "city-center", name: "Center", x: 34, y: 38.5 },
  { id: "city-west", name: "West", x: 27.5, y: 40.5 },
  { id: "city-east", name: "East", x: 40.5, y: 37.5 },
];
const syntheticValidation = validateGeoreference({ georeferencer, cityAnchors: syntheticCities, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
assert.equal(syntheticValidation.valid, true);
assert.equal(syntheticValidation.insideCount, 3);
assert.equal(syntheticValidation.outsideCount, 0);
passed += 1;

// 3b. WRONGLY-declared extent (shifted west by 5 degrees) is detected
//     fail-closed: eastern cities land outside the image.
const wrongExtent = { minX: 21, minY: 35, maxX: 37, maxY: 42 };
const { georeferencer: wrongGeoref } = fitFromExtent({ imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, extent: wrongExtent });
const wrongValidation = validateGeoreference({ georeferencer: wrongGeoref, cityAnchors: syntheticCities, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
assert.equal(wrongValidation.valid, false, "wrong extent must be detected via city anchors");
assert.equal(wrongValidation.outsideCount, 1);
const eastAnchor = wrongValidation.anchors.find((anchor) => anchor.id === "city-east");
assert.equal(eastAnchor.inside, false);
assert.ok(eastAnchor.pixel[0] > IMAGE_WIDTH, "eastern city must land beyond the right edge");
passed += 1;

// 4. Real ANATOLIA_CITY_ATLAS anchors validate against the Anatolia extent.
const atlasAnchors = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, city]) => ({ id, name: city.name, x: city.x, y: city.y }));
const atlasValidation = validateGeoreference({ georeferencer, cityAnchors: atlasAnchors, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
assert.equal(atlasValidation.insideCount, atlasAnchors.length, `all ${atlasAnchors.length} atlas anchors must fall inside the Anatolia extent`);
assert.equal(atlasValidation.valid, true);
passed += 1;

// 4b. An extent that excludes northern Anatolia is caught automatically:
//     Konstantinopolis (lat 41.0) must land outside a lat [35, 38] extent.
const northernExtent = { minX: 26, minY: 35, maxX: 42, maxY: 38 };
const { georeferencer: northernGeoref } = fitFromExtent({ imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, extent: northernExtent });
const northernValidation = validateGeoreference({ georeferencer: northernGeoref, cityAnchors: atlasAnchors, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
assert.equal(northernValidation.valid, false);
const konstantinopolis = northernValidation.anchors.find((anchor) => anchor.id === "konstantinopolis");
assert.equal(konstantinopolis.inside, false, "Konstantinopolis must be outside a lat<=38 extent");
assert.ok(northernValidation.outsideCount > 0);
passed += 1;

// 5. autoCalibrate end-to-end: ready for a consistent extent.
const calibration = autoCalibrate({
  imageWidth: IMAGE_WIDTH,
  imageHeight: IMAGE_HEIGHT,
  extent: ANATOLIA_EXTENT,
  cityAnchors: atlasAnchors,
  includeMidpoints: true,
});
assert.equal(calibration.ready, true);
assert.equal(calibration.controlPoints.length, 9);
assert.equal(calibration.validation.valid, true);
assert.ok(calibration.georeferencer.toGeo);
passed += 1;

// 5b. autoCalibrate fails closed for an inconsistent extent.
const badCalibration = autoCalibrate({
  imageWidth: IMAGE_WIDTH,
  imageHeight: IMAGE_HEIGHT,
  extent: northernExtent,
  cityAnchors: atlasAnchors,
});
assert.equal(badCalibration.ready, false);
assert.equal(badCalibration.validation.valid, false);
passed += 1;

// 6. Input validation.
assert.throws(() => deriveCornerControlPoints({ imageWidth: 0, imageHeight: 100, extent: ANATOLIA_EXTENT }), /positive integers/);
assert.throws(() => deriveCornerControlPoints({ imageWidth: 100, imageHeight: 100, extent: { minX: 5, minY: 1, maxX: 5, maxY: 2 } }), /positive-area/);
assert.throws(() => validateGeoreference({ georeferencer: {}, cityAnchors: [], imageWidth: 10, imageHeight: 10 }), /toPixel/);
passed += 1;

// 7. Two-click extent solver: two city clicks solve the extent, and the
//    full calibrateFromAnchorPixels pipeline produces a ready calibration
//    whose georeferencer round-trips every atlas anchor exactly.
const atlasById = ANATOLIA_CITY_ATLAS;
// Two visually identifiable, geographically well-separated cities:
// Konstantinopolis (northwest) and Kayseri/Caesarea (southeast).
const clickedAnchors = ["konstantinopolis", "kayseri"].map((id) => atlasById[id]).filter(Boolean);
assert.equal(clickedAnchors.length, 2, "test needs Konstantinopolis and Antalya in the atlas");
// Simulate the user clicking those cities on the reference map: the map's
// true extent is slightly larger than the declared one.
const TRUE_EXTENT = { minX: 25.7, minY: 35.4, maxX: 43.2, maxY: 42.6 };
const mapToPixel = ([lon, lat]) => [((lon - TRUE_EXTENT.minX) / (TRUE_EXTENT.maxX - TRUE_EXTENT.minX)) * MAP_WIDTH, ((TRUE_EXTENT.maxY - lat) / (TRUE_EXTENT.maxY - TRUE_EXTENT.minY)) * MAP_HEIGHT];
const correspondences = clickedAnchors.map((city) => ({ pixel: mapToPixel([city.x, city.y]), geo: [city.x, city.y] }));
const solvedExtent = solveExtentFromAnchorPixels({ correspondences, imageWidth: MAP_WIDTH, imageHeight: MAP_HEIGHT });
assert.ok(Math.abs(solvedExtent.minX - TRUE_EXTENT.minX) < 1e-9, "solved minX must match the true extent");
assert.ok(Math.abs(solvedExtent.maxX - TRUE_EXTENT.maxX) < 1e-9, "solved maxX must match the true extent");
assert.ok(Math.abs(solvedExtent.minY - TRUE_EXTENT.minY) < 1e-9, "solved minY must match the true extent");
assert.ok(Math.abs(solvedExtent.maxY - TRUE_EXTENT.maxY) < 1e-9, "solved maxY must match the true extent");
passed += 1;

// 7b. Full two-click calibration: ready, all 39 atlas anchors round-trip.
const twoClick = calibrateFromAnchorPixels({
  imageWidth: MAP_WIDTH,
  imageHeight: MAP_HEIGHT,
  correspondences,
  cityAnchors: atlasAnchors,
  includeMidpoints: true,
});
assert.equal(twoClick.ready, true);
assert.equal(twoClick.validation.valid, true);
assert.equal(twoClick.controlPoints.length, 9);
const twoClickGeoref = twoClick.georeferencer;
for (const city of Object.values(atlasById)) {
  const [px, py] = twoClickGeoref.toPixel(city.x, city.y);
  const [glon, glat] = twoClickGeoref.toGeo(px, py);
  assert.ok(Math.abs(glon - city.x) < 1e-9 && Math.abs(glat - city.y) < 1e-9, `atlas anchor ${city.name} must round-trip through the two-click calibration`);
}
passed += 1;

// 7c. Mislabeled clicks: with THREE correspondences, one mislabeled city
//     breaks the linear consistency and is rejected fail-closed by the
//     solver itself.
const thirdCity = atlasById["sivas"];
assert.ok(thirdCity, "test needs Sivas in the atlas");
const threeClicks = [
  ...correspondences,
  { pixel: mapToPixel([thirdCity.x, thirdCity.y]), geo: [thirdCity.x, thirdCity.y] },
];
const threeSolved = solveExtentFromAnchorPixels({ correspondences: threeClicks, imageWidth: MAP_WIDTH, imageHeight: MAP_HEIGHT });
assert.ok(Math.abs(threeSolved.minX - TRUE_EXTENT.minX) < 1e-9, "three correct clicks still solve the extent exactly");
const mislabeled = threeClicks.map((item, index) => (
  index === 2 ? { pixel: [item.pixel[0] + 80, item.pixel[1]], geo: item.geo } : item
));
assert.throws(
  () => solveExtentFromAnchorPixels({ correspondences: mislabeled, imageWidth: MAP_WIDTH, imageHeight: MAP_HEIGHT }),
  /inconsistent with the linear map/,
  "a mislabeled third click must be rejected by the consistency check",
);
passed += 1;

// 7d. Two MISLABELED clicks: the solver cannot detect it (2 points always
//     self-consistent), but the city-anchor sanity gate catches it — the
//     wrong extent pushes atlas anchors outside the image, ready=false.
const twoMislabeled = [
  { pixel: [correspondences[0].pixel[0], correspondences[0].pixel[1]], geo: correspondences[0].geo },
  { pixel: [correspondences[1].pixel[0] + 80, correspondences[1].pixel[1]], geo: correspondences[1].geo },
];
const badTwoClick = calibrateFromAnchorPixels({
  imageWidth: MAP_WIDTH,
  imageHeight: MAP_HEIGHT,
  correspondences: twoMislabeled,
  cityAnchors: atlasAnchors,
});
assert.equal(badTwoClick.ready, false, "mislabeled two-click calibration must fail the anchor gate");
assert.equal(badTwoClick.validation.valid, false);
assert.ok(badTwoClick.validation.outsideCount > 0, "atlas anchors must land outside the wrong extent");
passed += 1;

console.log(`Control point automation contract passed: ${passed} checks — extent-derived corners, exact fit, city-anchor sanity gate (fail-closed wrong-extent detection), real atlas anchors, autoCalibrate end-to-end, two-click extent solver (3-click mislabel rejection + 2-click anchor-gate catch).`);
