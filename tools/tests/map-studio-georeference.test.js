/**
 * Historia AI — Map Studio Georeference contract test.
 *
 * Proves the editorial automation chain end to end WITHOUT hand-written
 * coordinates: pixel clicks on a georeferenced historical map become
 * WGS84 coordinates through the fitted affine transform, and the resulting
 * source document flows through the proof-group pipeline as VALID.
 *
 *  1. Affine fit: exact round-trip with 3 control points; least-squares
 *     residuals stay tiny with 5 noisy control points; collinear points are
 *     rejected.
 *  2. Digitization: digitizeRing converts pixel positions to closed
 *     GeoJSON rings.
 *  3. Chain proof: rings "clicked" on a synthetic georeferenced map produce
 *     a source document that validateProofGroup accepts as a valid proof
 *     group with Euler characteristic 2 — no hand-written coordinates.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fitGeoreferencer, digitizeRing, ringSignedArea } from "../../src/map/studio/MapGeoreferencer.js";
import { validateProofGroup } from "../historical-gis/province/ProvinceProofGroup.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/proof-grid");
const coverage = JSON.parse(await readFile(path.join(fixtureDirectory, "coverage.json"), "utf8"));
const provincesManifest = JSON.parse(await readFile(path.join(fixtureDirectory, "provinces.json"), "utf8"));

let passed = 0;

// 1. Affine fit: exact round-trip with 3 control points.
// Synthetic map: 1 degree = 100 pixels, image origin at geo (0,0).
const known = { pxPerDeg: 100, lon0: 0, lat0: 0 };
const toPixelKnown = ([lon, lat]) => [(lon - known.lon0) * known.pxPerDeg, (known.lat0 - lat) * known.pxPerDeg];
const controlPoints = [
  { pixel: toPixelKnown([0, 0]), geo: [0, 0] },
  { pixel: toPixelKnown([3, 0]), geo: [3, 0] },
  { pixel: toPixelKnown([0, 3]), geo: [0, 3] },
];
const georefExact = fitGeoreferencer(controlPoints);
for (const [lon, lat] of [[0.5, 0.25], [2.7, 1.4], [1, 1]]) {
  const [px, py] = georefExact.toPixel(lon, lat);
  const [glon, glat] = georefExact.toGeo(px, py);
  assert.ok(Math.abs(glon - lon) < 1e-9 && Math.abs(glat - lat) < 1e-9, "exact affine round-trip");
}
assert.equal(georefExact.rmsResidual < 1e-9, true, "exact fit must have near-zero residuals");
passed += 1;

// 2. Least-squares fit with 5 noisy control points keeps residuals small.
const noisyControlPoints = [
  { pixel: toPixelKnown([0, 0]), geo: [0.0002, -0.0001] },
  { pixel: toPixelKnown([3, 0]), geo: [3.0001, 0.0002] },
  { pixel: toPixelKnown([0, 3]), geo: [-0.0001, 2.9998] },
  { pixel: toPixelKnown([3, 3]), geo: [2.9999, 3.0002] },
  { pixel: toPixelKnown([1.5, 1.5]), geo: [1.5002, 1.4999] },
];
const georefNoisy = fitGeoreferencer(noisyControlPoints);
assert.equal(georefNoisy.controlPointCount, 5);
assert.ok(georefNoisy.rmsResidual < 0.001, `least-squares residual must stay tiny, got ${georefNoisy.rmsResidual}`);
// Evaluate at the pixel the mapping produces for geo (1.5, 1.5): the helper
// maps lat with (lat0 - lat), so pixel y is negative for northern latitudes.
const [centerPx, centerPy] = toPixelKnown([1.5, 1.5]);
const [glon, glat] = georefNoisy.toGeo(centerPx, centerPy);
assert.ok(Math.abs(glon - 1.5) < 0.001 && Math.abs(glat - 1.5) < 0.001, "least-squares center estimate within tolerance");
passed += 1;

// 3. Collinear control points are rejected (fail-closed).
assert.throws(
  () => fitGeoreferencer([
    { pixel: [0, 0], geo: [0, 0] },
    { pixel: [100, 100], geo: [1, 1] },
    { pixel: [200, 200], geo: [2, 2] },
  ]),
  /collinear or degenerate/,
);
passed += 1;

// 4. digitizeRing produces a closed GeoJSON ring in geo coordinates.
// Pixels chosen to map to the geo square (0,0)->(1,0)->(1,1)->(0,1):
// with lat0=0 and y growing southward, geo lat 1 is pixel y = -100.
const ring = digitizeRing(georefExact, [[0, 0], [100, 0], [100, -100], [0, -100]]);
assert.equal(ring.length, 5, "ring must be closed (first point repeated)");
assert.deepEqual(ring[0], ring.at(-1));
assert.equal(ring[0][0], 0);
assert.equal(ring.at(-2)[0], 0);
assert.equal(ring.at(-2)[1], 1);
passed += 1;

// 5. Chain proof: pixel clicks -> georeferenced rings -> source document ->
//    validateProofGroup VALID with Euler 2. No hand-written coordinates.
//
// The synthetic map spans geo [0..3] x [0..1] (proof-grid coverage bbox).
// Pixel scale: 1 degree = 200 px; the map image is 600x200 px with origin
// at geo (0,1) top-left (north-up), so pixel y grows southward.
const mapScale = 200;
const mapToPixel = ([lon, lat]) => [lon * mapScale, (1 - lat) * mapScale];
const mapControlPoints = [
  { pixel: mapToPixel([0, 1]), geo: [0, 1] },
  { pixel: mapToPixel([3, 1]), geo: [3, 1] },
  { pixel: mapToPixel([0, 0]), geo: [0, 0] },
  { pixel: mapToPixel([3, 0]), geo: [3, 0] },
];
const mapGeoref = fitGeoreferencer(mapControlPoints);
assert.ok(mapGeoref.rmsResidual < 1e-9, "synthetic map georeference must be exact");

// Editor "clicks" the three adjacent province boundaries on the map.
const clickedPixels = {
  "proof-a": [[0, 200], [200, 200], [200, 0], [0, 0]],
  "proof-b": [[200, 200], [400, 200], [400, 0], [200, 0]],
  "proof-c": [[400, 200], [600, 200], [600, 0], [400, 0]],
};

const sourceDocument = {
  sourceId: "synthetic-map-studio-editorial",
  sourceRef: "test-only: digitized from a synthetic georeferenced map",
  reviewStatus: "reviewed",
  provinces: ["proof-a", "proof-b", "proof-c"].map((provinceId) => {
    const ring = digitizeRing(mapGeoref, clickedPixels[provinceId]);
    return {
      provinceId,
      sourceRef: "test-only digitization",
      confidence: 0.9,
      reviewStatus: "reviewed",
      ring,
    };
  }),
};

// The digitized rings must have the same geometry as the canonical
// proof-grid rings (up to floating-point noise from the transform).
for (const province of sourceDocument.provinces) {
  const area = ringSignedArea(province.ring);
  assert.ok(Math.abs(area) > 0.4, `${province.provinceId}: digitized ring must cover ~0.5 sq degrees`);
  const closed = province.ring[0][0] === province.ring.at(-1)[0] && province.ring[0][1] === province.ring.at(-1)[1];
  assert.equal(closed, true, `${province.provinceId}: ring must be closed`);
}

const report = validateProofGroup({ sourceDocument, coverage, provincesManifest });
assert.equal(report.status, "valid", `proof group must accept the digitized document: ${report.provinces.map((p) => p.errors.join("; ")).filter(Boolean).join(" | ")}`);
assert.equal(report.eulerCharacteristic, 2);
assert.equal(report.notProductionAuthority, true);
passed += 1;

console.log(`Map Studio georeference contract passed: ${passed} checks — affine fit (exact + least-squares + collinear rejection), digitized rings, and the full editorial chain: pixel clicks -> georef -> source document -> proof group VALID (Euler=2).`);
