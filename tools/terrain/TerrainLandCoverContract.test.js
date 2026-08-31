import assert from "node:assert/strict";
import { createAuthoritativeLandCover } from "./TerrainLandCoverContract.js";

const classes = ["desert", "forest", "steppe", "rock", "snow"];
const raster = createAuthoritativeLandCover({ sourceId: "test-landcover", sourceUrl: "https://example.com/landcover", attribution: "Authoritative test source", width: 2, height: 2, crs: "EPSG:4326", bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 }, resolution: 0.01, classes, values: Uint8Array.from([0,1,2,3]), noDataValue: 255 });
assert.equal(raster.sourceId, "test-landcover");
assert.deepEqual(raster.classes, classes);
assert.equal(raster.values.length, 4);
assert.throws(() => createAuthoritativeLandCover({ sourceId: "x", sourceUrl: "https://example.com/x", attribution: "x", width: 1, height: 1, crs: "EPSG:4326", bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 }, resolution: 1, classes: ["desert"], values: Uint8Array.from([0]) }), /missing forest/);
assert.throws(() => createAuthoritativeLandCover({ sourceId: "x", sourceUrl: "not-a-url", attribution: "x", width: 1, height: 1, crs: "EPSG:4326", bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 }, resolution: 1, classes, values: Uint8Array.from([0]) }), /HTTP/);
assert.throws(() => createAuthoritativeLandCover({ sourceId: "x", sourceUrl: "https://example.com/x", attribution: "x", width: 1, height: 1, crs: "EPSG:4326", bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 }, resolution: 1, classes, values: Uint8Array.from([9]) }), /invalid class index/);
console.log("Phase E authoritative land-cover contract: PASS");
