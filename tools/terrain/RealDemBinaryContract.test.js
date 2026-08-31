import assert from "node:assert/strict";
import { assertDemBinaryPayload, assertNoSyntheticDemFallback, validateDemBinaryMetadata } from "./RealDemBinaryContract.js";

const provenance = {
  authority: "Copernicus Data Space Ecosystem",
  sourceInstance: "COPERNICUS_90",
  surfaceType: "DSM",
  fictionalElevationAllowed: false,
};

const metadata = {
  container: "GeoTIFF",
  byteLength: 1024,
  width: 3,
  height: 3,
  sampleType: "float32",
  noDataValue: -9999,
  crs: "EPSG:4326",
  resolutionMeters: 90,
  bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 },
  provenance,
};

assert.equal(validateDemBinaryMetadata(metadata).version, 1);
assert.equal(assertDemBinaryPayload({ metadata, samples: [1, 2, 3, 4, 5, 6, 7, 8, 9] }).validSamples, 9);
assert.equal(assertDemBinaryPayload({ metadata, samples: [-9999, 1, 2, 3, 4, 5, 6, 7, 8] }).validSamples, 8);
assert.throws(() => assertDemBinaryPayload({ metadata, samples: [-9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999] }));
assert.throws(() => validateDemBinaryMetadata({ ...metadata, container: "PNG" }));
assert.throws(() => validateDemBinaryMetadata({ ...metadata, crs: null }));
assert.throws(() => validateDemBinaryMetadata({ ...metadata, provenance: { ...provenance, fictionalElevationAllowed: true } }));
assert.equal(assertNoSyntheticDemFallback("real-binary"), true);
assert.throws(() => assertNoSyntheticDemFallback("fixture"));

console.log("Phase E real DEM binary contract: PASS");
