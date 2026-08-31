import assert from "node:assert/strict";
import {
  COPERNICUS_DEM_SOURCES,
  assertRealDemProvenance,
  createDemTileId,
  createDemTileProvenance,
  resolveCopernicusDemSource,
} from "./CopernicusDemSource.js";

assert.equal(resolveCopernicusDemSource().id, "COPERNICUS_90");
assert.equal(resolveCopernicusDemSource("COPERNICUS_30").resolutionMeters, 30);
assert.equal(COPERNICUS_DEM_SOURCES.GLO90.type, "DSM");
assert.equal(createDemTileId(37, 30), "N37_E030");
assert.equal(createDemTileId(-37, -30), "S37_W030");
assert.throws(() => resolveCopernicusDemSource("invented"));
assert.throws(() => createDemTileId(90, 0));

const provenance = createDemTileProvenance({
  source: "COPERNICUS_90",
  gridId: "N37_E030",
  productId: "Copernicus_DSM_90_N37_00_E030_00",
});
assert.equal(provenance.authority, "Copernicus Data Space Ecosystem");
assert.equal(provenance.sourceInstance, "COPERNICUS_90");
assert.equal(provenance.gridId, "N37_E030");
assert.equal(provenance.surfaceType, "DSM");
assert.equal(provenance.fictionalElevationAllowed, false);
assert.equal(assertRealDemProvenance(provenance), provenance);
assert.throws(() => assertRealDemProvenance({ surfaceType: "DSM" }));

console.log("Copernicus DEM source contract: PASS");
