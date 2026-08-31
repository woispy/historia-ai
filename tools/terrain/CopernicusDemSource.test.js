import assert from "node:assert/strict";
import { COPERNICUS_DEM_SOURCES, createDemTileProvenance, resolveCopernicusDemSource } from "./CopernicusDemSource.js";

assert.equal(resolveCopernicusDemSource().id, "COPERNICUS_90");
assert.equal(resolveCopernicusDemSource("COPERNICUS_30").resolutionMeters, 30);
assert.equal(COPERNICUS_DEM_SOURCES.GLO90.type, "DSM");
assert.throws(() => resolveCopernicusDemSource("invented"));

const provenance = createDemTileProvenance({
  source: "COPERNICUS_90",
  gridId: "N37_E030",
  productId: "Copernicus_DSM_90_N37_00_E030_00",
});
assert.equal(provenance.authority, "Copernicus Data Space Ecosystem");
assert.equal(provenance.sourceInstance, "COPERNICUS_90");
assert.equal(provenance.gridId, "N37_E030");
assert.equal(provenance.surfaceType, "DSM");

console.log("Copernicus DEM source contract: PASS");
