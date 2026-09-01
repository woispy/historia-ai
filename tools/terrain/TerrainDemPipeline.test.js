import assert from "node:assert/strict";
import { createDemTileProvenance, COPERNICUS_DEM_SOURCES } from "./CopernicusDemSource.js";
import { buildHeightmap, deriveNormals, validateDemRaster, bilinearSample } from "./TerrainDemPipeline.js";

const provenance = createDemTileProvenance({
  source: COPERNICUS_DEM_SOURCES.GLO90,
  gridId: "N37_E030",
  productId: "fixture-real-source-reference",
});

const raster = { width: 2, height: 2, samples: Float32Array.from([0, 10, 20, 30]) };
assert.deepEqual(validateDemRaster(raster), { width: 2, height: 2, validSamples: 4, min: 0, max: 30, noDataValue: null });
assert.equal(bilinearSample(raster, 0.5, 0.5), 15);
const heightmap = buildHeightmap({ raster, outputSize: 3, provenance });
assert.equal(heightmap.size, 3);
assert.equal(heightmap.noDataValue, null);
assert.deepEqual(Array.from(heightmap.heights), [0, 5, 10, 10, 15, 20, 20, 25, 30]);
const normals = deriveNormals(heightmap.heights, 3, 1);
assert.equal(normals.length, 27);
for (let i = 0; i < normals.length; i += 3) {
  const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
  assert.ok(Math.abs(length - 1) < 1e-6);
}

const nodataRaster = { width: 2, height: 2, samples: Float32Array.from([0, -9999, 20, 30]), noDataValue: -9999 };
assert.deepEqual(validateDemRaster(nodataRaster), { width: 2, height: 2, validSamples: 3, min: 0, max: 30, noDataValue: -9999 });
assert.equal(bilinearSample(nodataRaster, 0.25, 0.25), null);
assert.throws(() => buildHeightmap({ raster: nodataRaster, outputSize: 3, provenance }), /no-data samples/);

assert.throws(() => buildHeightmap({ raster, outputSize: 3 }), /authoritative real-DEM provenance/);
assert.throws(() => validateDemRaster({ width: 2, height: 2, samples: [NaN, NaN, NaN, NaN] }), /no valid/);
assert.throws(() => validateDemRaster({ width: 2, height: 2, samples: [0, 1, 2] }), /sample count/);
assert.throws(() => validateDemRaster({ width: 2, height: 2, samples: [-9999, -9999, -9999, -9999], noDataValue: -9999 }), /no valid/);

console.log("Terrain DEM pipeline contracts: PASS");
