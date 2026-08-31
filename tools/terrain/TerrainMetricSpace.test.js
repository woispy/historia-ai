import assert from "node:assert/strict";
import { createTerrainMetricSpace } from "./TerrainMetricSpace.js";

const geographic = createTerrainMetricSpace({ crs: "EPSG:4326" });
const atEquator = geographic.distancePerDegree(0);
assert.ok(atEquator.longitudeMeters > 111000 && atEquator.longitudeMeters < 111500);
assert.ok(atEquator.latitudeMeters > 110000 && atEquator.latitudeMeters < 112000);
const west = geographic.project(30, 39);
const east = geographic.project(31, 39);
assert.ok(east.x > west.x);
assert.equal(east.y, west.y);

const mercator = createTerrainMetricSpace({ crs: "EPSG:3857" });
const origin = mercator.project(0, 0);
assert.deepEqual(origin, { x: 0, y: 0 });
assert.throws(() => mercator.project(0, 86), /Web Mercator domain/);
assert.throws(() => createTerrainMetricSpace({ crs: "EPSG:32636" }), /Unsupported/);
console.log("Phase E metric terrain space: PASS");
