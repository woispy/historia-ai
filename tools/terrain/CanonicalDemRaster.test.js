import assert from "node:assert/strict";
import { createCanonicalDemRaster } from "./CanonicalDemRaster.js";
import { createDemProvenance, COPERNICUS_DEM_PRODUCTS } from "./CopernicusDemSource.js";

const provenance = createDemProvenance({ tileId: "N37_E030", product: COPERNICUS_DEM_PRODUCTS.GLO90, resolutionMeters: 90 });
const decoded = {
  metadata: { container: "GeoTIFF", byteLength: 8, width: 2, height: 2, sampleType: "int16", noDataValue: -9999, crs: "EPSG:4326", resolutionMeters: 90, bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 }, provenance },
  samples: Int16Array.from([100, 110, 120, 130]),
  min: 100,
  max: 130,
  validSamples: 4,
  georeferencing: { pixelScale: [1, 1, 0], tiepoint: [0, 0, 0, 30, 38, 0], geoKeys: [1, 1, 0, 1, 1024, 0, 1, 2, 2048, 0, 1, 4326] },
};
const raster = createCanonicalDemRaster({ decoded });
assert.equal(raster.crs, "EPSG:4326");
assert.deepEqual(raster.bounds, { minX: 30, minY: 37, maxX: 31, maxY: 38 });
assert.equal(raster.noDataValue, -9999);
assert.deepEqual(Array.from(raster.samples), [100, 110, 120, 130]);
assert.deepEqual(raster.pixelToWorld(1, 1), { x: 31, y: 37 });
assert.throws(() => createCanonicalDemRaster({ decoded: { ...decoded, metadata: { ...decoded.metadata, bounds: { minX: 30, minY: 36, maxX: 31, maxY: 38 } } } }), /bounds do not match/);
console.log("Phase E canonical DEM raster: PASS");
