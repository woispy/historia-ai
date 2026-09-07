import assert from "node:assert/strict";

import {
  P62_COPERNICUS_GLO30_CONTRACT,
  isCopernicusGlo30Promoted,
  validateCopernicusGlo30Manifest,
} from "../historical-gis/P62CopernicusDemContract.js";

const validManifest = {
  schemaVersion: 1,
  authority: "Copernicus DEM GLO-30",
  dataset: "COP-DEM_GLO-30-DGED",
  release: "2024_1",
  format: "GeoTIFF-DGED",
  horizontalCrs: "EPSG:4326",
  verticalCrs: "EPSG:3855",
  tileExtent: "1x1-degree-latitude-longitude",
  gridSpacingArcSeconds: 1,
  runtimeRule: "build-data-only",
  checksumRule: "sha256-required-per-tile",
  tiles: [{
    id: "N40_E030",
    catalogDataset: "COP-DEM_GLO-30-DGED/2024_1",
    downloadLocator: "odata-product-id:example",
    sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  }],
};

assert.equal(P62_COPERNICUS_GLO30_CONTRACT.dataset, "COP-DEM_GLO-30-DGED");
assert.equal(P62_COPERNICUS_GLO30_CONTRACT.horizontalCrs, "EPSG:4326");
assert.equal(P62_COPERNICUS_GLO30_CONTRACT.verticalCrs, "EPSG:3855");
assert.equal(P62_COPERNICUS_GLO30_CONTRACT.tileExtent, "1x1-degree-latitude-longitude");

assert.throws(
  () => validateCopernicusGlo30Manifest({ ...validManifest, tiles: [{ ...validManifest.tiles[0], sha256: null }] }),
  /valid SHA-256 checksum/,
);

assert.throws(
  () => validateCopernicusGlo30Manifest({ ...validManifest, release: "2023_1" }),
  /pinned release 2024_1/,
);

assert.throws(
  () => validateCopernicusGlo30Manifest({ ...validManifest, verticalCrs: "EPSG:4326" }),
  /EGM2008 \/ EPSG:3855/,
);

const emptyManifest = { ...validManifest, tiles: [] };
validateCopernicusGlo30Manifest(emptyManifest);
assert.equal(isCopernicusGlo30Promoted(emptyManifest), false);
assert.equal(isCopernicusGlo30Promoted(validManifest), true);

console.log("P6.2-A Copernicus GLO-30 acquisition contract: PASS");
console.log(`authority=${P62_COPERNICUS_GLO30_CONTRACT.authority}`);
console.log(`dataset=${P62_COPERNICUS_GLO30_CONTRACT.dataset}`);
console.log(`release=${P62_COPERNICUS_GLO30_CONTRACT.release}`);
console.log(`runtimeRule=${P62_COPERNICUS_GLO30_CONTRACT.runtimeRule}`);
console.log("repositoryManifestTiles=0 (authority acquisition not yet promoted)");
