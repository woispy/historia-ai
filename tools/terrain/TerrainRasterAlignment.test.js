import assert from "node:assert/strict";
import { resampleLandCoverNearest, validateTerrainRasterAlignment } from "./TerrainRasterAlignment.js";

const dem = { width: 3, height: 3, crs: "EPSG:4326", resolutionMeters: 90, bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 } };
const landCover = { width: 2, height: 2, crs: "EPSG:4326", resolution: 0.5, bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 }, values: Uint8Array.from([0,1,2,3]) };
const alignment = validateTerrainRasterAlignment({ dem, landCover });
assert.equal(alignment.aligned, true);
assert.deepEqual(Array.from(resampleLandCoverNearest({ landCover, targetWidth: 3, targetHeight: 3 })), [0,0,1,0,0,1,2,2,3]);
assert.throws(() => validateTerrainRasterAlignment({ dem, landCover: { ...landCover, crs: "EPSG:3857" } }), /CRS mismatch/);
assert.throws(() => validateTerrainRasterAlignment({ dem, landCover: { ...landCover, bounds: { ...landCover.bounds, maxX: 2 } } }), /bounds mismatch/);
console.log("Phase E terrain raster alignment: PASS");
