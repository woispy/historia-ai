import assert from "node:assert/strict";
import { createTerrainDataContract } from "./TerrainDataContract.js";

const contract = createTerrainDataContract({
  demInstance: "COPERNICUS_90",
  sourceTiles: ["N37_E030", "N37_E031"],
  outputGrid: { crs: "EPSG:4326", resolutionMeters: 90, interpolation: "bilinear" },
});

assert.equal(contract.authority, "Copernicus Data Space Ecosystem");
assert.equal(contract.source.type, "DSM");
assert.deepEqual(contract.sourceTiles, ["N37_E030", "N37_E031"]);
assert.equal(contract.outputGrid.crs, "EPSG:4326");
assert.equal(contract.outputGrid.resolutionMeters, 90);
assert.ok(contract.rule.includes("No invented elevation"));
assert.throws(() => createTerrainDataContract({ sourceTiles: [], outputGrid: { crs: "EPSG:4326", resolutionMeters: 90 } }));
assert.throws(() => createTerrainDataContract({ sourceTiles: ["N37_E030"], outputGrid: { resolutionMeters: 90 } }));

console.log("Terrain data authority contract: PASS");
