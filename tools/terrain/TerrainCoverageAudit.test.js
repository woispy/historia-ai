import assert from "node:assert/strict";
import { createDemTileProvenance } from "./CopernicusDemSource.js";
import { auditDemCoverage, requiredDemTilesForBounds } from "./TerrainCoverageAudit.js";

const required = requiredDemTilesForBounds({ minLatitude: 36.8, maxLatitude: 42.2, minLongitude: 26.0, maxLongitude: 45.0 });
assert.ok(required.length > 0);
assert.ok(required.includes("N37_E030"));
assert.ok(required.includes("N42_E044"));

const provenanceByTile = Object.fromEntries(required.map((tile) => [tile, createDemTileProvenance({ source: "COPERNICUS_90", gridId: tile, productId: `fixture-${tile}` })]));
const pass = auditDemCoverage({ requiredTiles: required, availableTiles: required, expectedResolutionMeters: 90, provenanceByTile });
assert.equal(pass.passed, true);
assert.equal(pass.missing.length, 0);
assert.equal(pass.invalidResolution.length, 0);
assert.equal(pass.missingProvenance.length, 0);

const missing = auditDemCoverage({ requiredTiles: required, availableTiles: required.slice(1), expectedResolutionMeters: 90, provenanceByTile });
assert.equal(missing.passed, false);
assert.ok(missing.missing.length > 0);

const badResolution = { ...provenanceByTile, [required[0]]: createDemTileProvenance({ source: "COPERNICUS_30", gridId: required[0], productId: "wrong-resolution" }) };
const invalid = auditDemCoverage({ requiredTiles: required, availableTiles: required, expectedResolutionMeters: 90, provenanceByTile: badResolution });
assert.equal(invalid.passed, false);
assert.deepEqual(invalid.invalidResolution, [required[0]]);

console.log("Phase E authoritative DEM coverage: PASS");
