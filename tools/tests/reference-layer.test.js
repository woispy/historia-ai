/**
 * Historia AI — Map Studio Reference Layer contract test.
 *
 * Verifies the Open-Historia-quality land/sea reference drawing with the
 * REAL Natural Earth 10m physical atlas data (mock canvas context, Node):
 *  - Sea background fills the canvas.
 *  - Land mask with detailed coastline draws and clips to the view extent.
 *  - Lakes and rivers draw with the expected style.
 *  - Features outside the view extent are skipped (clipping).
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { drawLandAndSea, drawLakes, drawRivers, drawReferenceLayer, referenceLayerStyle } from "../../src/map/studio/ReferenceLayerRenderer.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const atlasPath = path.join(root, "src/map/data/AnatoliaPhysicalAtlasRuntime.js");

// Load the real physical atlas runtime (ESM import from path).
const atlasModule = await import(new URL(`file:///${atlasPath.replace(/\\/g, "/")}`).href);
const atlas = atlasModule.ANATOLIA_PHYSICAL_ATLAS_RUNTIME;

let passed = 0;

/** Minimal recording mock of a CanvasRenderingContext2D. */
function mockContext() {
  const calls = [];
  const ctx = {
    canvas: { width: 760, height: 560 },
    fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
    fillRect: (x, y, w, h) => calls.push({ op: "fillRect", x, y, w, h }),
    beginPath: () => calls.push({ op: "beginPath" }),
    closePath: () => calls.push({ op: "closePath" }),
    moveTo: (x, y) => calls.push({ op: "moveTo", x, y }),
    lineTo: (x, y) => calls.push({ op: "lineTo", x, y }),
    fill: () => calls.push({ op: "fill" }),
    stroke: () => calls.push({ op: "stroke" }),
    arc: (x, y, r) => calls.push({ op: "arc", x, y, r }),
  };
  return { ctx, calls };
}

const [minLon, minLat, maxLon, maxLat] = atlas.bbox;
const view = { minX: minLon, minY: minLat, maxX: maxLon, maxY: maxLat };
const geoToCanvas = (lon, lat) => [((lon - minLon) / (maxLon - minLon)) * 760, ((maxLat - lat) / (maxLat - minLat)) * 560];

// 1. Land and sea: sea fills the canvas, land mask draws with detailed coast.
const { ctx: ctx1, calls: calls1 } = mockContext();
const landResult = drawLandAndSea(ctx1, atlas.landPolygons, view, geoToCanvas);
assert.ok(calls1.some((call) => call.op === "fillRect" && call.w === 760 && call.h === 560), "sea background must fill the canvas");
assert.equal(landResult.landRingsDrawn, atlas.landPolygons.length, "all land rings in view must draw");
assert.ok(calls1.some((call) => call.op === "stroke"), "coastline must stroke");
assert.equal(ctx1.fillStyle, referenceLayerStyle.land);
passed += 1;

// 2. Lakes: every ring of every Natural Earth 10m lake draws (multi-ring
//    lakes with islands contribute multiple rings).
const expectedLakeRings = atlas.lakes.reduce((sum, lake) => sum + (lake?.rings?.length ?? (lake?.coordinates ? 1 : 0)), 0);
const { ctx: ctx2, calls: calls2 } = mockContext();
const lakeResult = drawLakes(ctx2, atlas.lakes, view, geoToCanvas);
assert.equal(lakeResult.lakesDrawn, expectedLakeRings, `all ${expectedLakeRings} lake rings across ${atlas.lakes.length} lakes must draw`);
assert.ok(calls2.filter((call) => call.op === "closePath").length >= expectedLakeRings);
assert.equal(ctx2.fillStyle, referenceLayerStyle.lake);
passed += 1;

// 3. Rivers: Natural Earth 10m river segments draw.
const { ctx: ctx3, calls: calls3 } = mockContext();
const riverResult = drawRivers(ctx3, atlas.rivers, view, geoToCanvas);
assert.equal(riverResult.riversDrawn, atlas.rivers.length, `all ${atlas.rivers.length} river segments must draw`);
assert.ok(calls3.filter((call) => call.op === "moveTo").length >= atlas.rivers.length);
assert.equal(ctx3.strokeStyle, referenceLayerStyle.river);
passed += 1;

// 4. Clipping: a view far from Anatolia skips all features.
const farView = { minX: -10, minY: -10, maxX: -5, maxY: -5 };
const farGeoToCanvas = (lon, lat) => [0, 0];
const { ctx: ctx4, calls: calls4 } = mockContext();
const farResult = drawReferenceLayer(ctx4, atlas, farView, farGeoToCanvas);
assert.equal(farResult.landRingsDrawn, 0, "land must be clipped outside the view");
assert.equal(farResult.lakesDrawn, 0, "lakes must be clipped outside the view");
assert.equal(farResult.riversDrawn, 0, "rivers must be clipped outside the view");
assert.equal(calls4.filter((call) => call.op === "beginPath").length, 0, "no paths may be built for an out-of-view extent");
passed += 1;

// 5. Full reference layer: counts add up over the real atlas.
const { ctx: ctx5 } = mockContext();
const full = drawReferenceLayer(ctx5, atlas, view, geoToCanvas);
assert.equal(full.landRingsDrawn, atlas.landPolygons.length);
assert.equal(full.lakesDrawn, expectedLakeRings);
assert.equal(full.riversDrawn, atlas.rivers.length);
passed += 1;

console.log(`Reference layer contract passed: ${passed} checks — real Natural Earth 10m atlas: ${atlas.landPolygons.length} land rings, ${expectedLakeRings} lake rings across ${atlas.lakes.length} lakes, ${atlas.rivers.length} rivers, view clipping verified, Open-Historia-style land/sea.`);
