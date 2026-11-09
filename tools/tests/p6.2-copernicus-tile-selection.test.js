import assert from "node:assert/strict";
import aoi from "../../src/world/map/source/physical/copernicus-glo30.aoi.json" with { type: "json" };
import selection from "../../data/gis/1326/physical-reference-intake/sakarya-glo30-tile-selection.json" with { type: "json" };
import sourceCandidate from "../../data/gis/1326/physical-reference-intake/sakarya-source-candidate.json" with { type: "json" };
import { expectedCopernicusGlo30TileIds, validateCopernicusGlo30TileSelection } from "../historical-gis/CopernicusGlo30TileSelection.js";

assert.equal(expectedCopernicusGlo30TileIds(aoi).length, aoi.tileCount);
assert.deepEqual(validateCopernicusGlo30TileSelection(selection, aoi), ["N40_E029", "N40_E030", "N41_E030"]);
assert.equal(selection.status, "GEOMETRY_DERIVED_CATALOG_CHECK_REQUIRED");
assert.match(selection.sourceGeometrySha256, /^[a-f0-9]{64}$/);
assert.equal(selection.sourceGeometrySha256, sourceCandidate.source.sourceGeometrySha256);

const testAoi = { west: 29, east: 32, south: 40, north: 42, tileSizeDegrees: 1, tileCount: 6 };
assert.deepEqual(expectedCopernicusGlo30TileIds(testAoi), ["N40_E029","N40_E030","N40_E031","N41_E029","N41_E030","N41_E031"]);
assert.throws(() => validateCopernicusGlo30TileSelection([], testAoi), /non-empty/);
assert.throws(() => validateCopernicusGlo30TileSelection(["N40_E029","N40_E029"], testAoi), /duplicate/);
assert.throws(() => validateCopernicusGlo30TileSelection(["N40_E999"], testAoi), /outside the pinned AOI/);
assert.throws(() => validateCopernicusGlo30TileSelection(["../N40_E029"], testAoi), /invalid grid ID/);
assert.throws(() => expectedCopernicusGlo30TileIds({...testAoi,tileCount:5}), /tileCount mismatch/);
console.log("P6.2-A Copernicus GLO-30 tile subset selection: PASS");
