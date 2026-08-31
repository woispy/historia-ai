import assert from "node:assert/strict";
import { createCopernicusDemSource, COPERNICUS_DEM_PRODUCTS } from "./CopernicusDemSource.js";
import { bilinearSample, buildHeightmap, deriveNormals, validateDemRaster } from "./TerrainDemPipeline.js";

const provenance = {
  provider: "Copernicus",
  product: COPERNICUS_DEM_PRODUCTS.GLO90,
  semanticType: "DSM",
  fictionalElevationAllowed: false,
};

const raster = {
  width: 3,
  height: 3,
  noDataValue: -32768,
  samples: Float32Array.from([0, 10, 20, 10, 20, 30, 20, 30, 40]),
};

const report = validateDemRaster(raster);
assert.equal(report.validSamples, 9);
assert.equal(report.noDataValue, -32768);
assert.equal(bilinearSample(raster, 0.5, 0.5), 20);

const withNoData = { ...raster, samples: Float32Array.from([0, 10, -32768, 10, 20, 30, 20, 30, 40]) };
assert.equal(bilinearSample(withNoData, 0.5, 0), null);

const heightmap = buildHeightmap({ raster, outputSize: 5, provenance });
assert.equal(heightmap.size, 5);
assert.equal(heightmap.heights[12], 20);
assert.equal(heightmap.version, 2);
assert.equal(heightmap.noDataValue, -32768);

const normals = deriveNormals(heightmap.heights, 5, 1);
assert.equal(normals.length, 75);
for (let i = 0; i < normals.length; i += 1) assert.ok(Number.isFinite(normals[i]));

assert.throws(() => buildHeightmap({ raster, outputSize: 5, provenance: { ...provenance, fictionalElevationAllowed: true } }));
assert.throws(() => buildHeightmap({ raster: { ...raster, samples: withNoData.samples }, outputSize: 5, provenance }));
assert.throws(() => createCopernicusDemSource({ product: "fictional-dem" }));

console.log("Terrain DEM pipeline: PASS");
