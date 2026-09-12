import manifest from "../../src/world/map/source/physical/copernicus-glo30.manifest.json" with { type: "json" };

const REQUIRED_DATASET = "COP-DEM_GLO-30-DGED";
const REQUIRED_RELEASE = "2024_1";
const REQUIRED_CRS = "EPSG:4326";
const REQUIRED_VERTICAL_CRS = "EPSG:3855";

export const P62_COPERNICUS_GLO30_CONTRACT = Object.freeze({
  schemaVersion: 1,
  authority: "Copernicus DEM GLO-30",
  dataset: REQUIRED_DATASET,
  release: REQUIRED_RELEASE,
  format: "GeoTIFF-DGED",
  horizontalCrs: REQUIRED_CRS,
  verticalCrs: REQUIRED_VERTICAL_CRS,
  tileExtent: "1x1-degree-latitude-longitude",
  gridSpacingArcSeconds: 1,
  runtimeRule: "build-data-only",
  checksumRule: "sha256-required-per-tile",
});

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`P6.2-A contract invalid: ${label} must be a non-empty string.`);
  }
}

export function validateCopernicusGlo30Manifest(value = manifest) {
  if (!value || typeof value !== "object") throw new Error("P6.2-A manifest must be an object.");
  if (value.schemaVersion !== 1) throw new Error(`P6.2-A manifest schemaVersion must be 1; received ${value.schemaVersion}.`);
  assertString(value.authority, "authority");
  assertString(value.dataset, "dataset");
  assertString(value.release, "release");
  assertString(value.format, "format");
  assertString(value.horizontalCrs, "horizontalCrs");
  assertString(value.verticalCrs, "verticalCrs");
  assertString(value.tileExtent, "tileExtent");

  if (value.authority !== P62_COPERNICUS_GLO30_CONTRACT.authority) throw new Error("P6.2-A manifest authority mismatch.");
  if (value.dataset !== REQUIRED_DATASET) throw new Error(`P6.2-A requires ${REQUIRED_DATASET}.`);
  if (value.release !== REQUIRED_RELEASE) throw new Error(`P6.2-A requires pinned release ${REQUIRED_RELEASE}.`);
  if (value.format !== P62_COPERNICUS_GLO30_CONTRACT.format) throw new Error("P6.2-A requires GeoTIFF DGED input.");
  if (value.horizontalCrs !== REQUIRED_CRS) throw new Error("P6.2-A requires WGS84 / EPSG:4326 horizontal coordinates.");
  if (value.verticalCrs !== REQUIRED_VERTICAL_CRS) throw new Error("P6.2-A requires EGM2008 / EPSG:3855 vertical coordinates.");
  if (value.tileExtent !== P62_COPERNICUS_GLO30_CONTRACT.tileExtent) throw new Error("P6.2-A requires 1x1-degree tile extents.");
  if (value.gridSpacingArcSeconds !== 1) throw new Error("P6.2-A requires GLO-30 one-arc-second grid spacing.");
  if (value.runtimeRule !== P62_COPERNICUS_GLO30_CONTRACT.runtimeRule) throw new Error("P6.2-A DEM must remain build-data-only.");
  if (value.checksumRule !== P62_COPERNICUS_GLO30_CONTRACT.checksumRule) throw new Error("P6.2-A requires a SHA-256 checksum for every promoted tile.");
  if (!Array.isArray(value.tiles)) throw new Error("P6.2-A manifest tiles must be an array.");

  for (const tile of value.tiles) {
    assertString(tile.id, "tile.id");
    assertString(tile.catalogDataset, "tile.catalogDataset");
    assertString(tile.downloadLocator, "tile.downloadLocator");
    assertString(tile.sha256, "tile.sha256");
    if (!/^[0-9a-f]{64}$/i.test(tile.sha256)) {
      throw new Error(`P6.2-A tile ${tile.id} has no valid SHA-256 checksum.`);
    }
    if (tile.catalogDataset !== `${REQUIRED_DATASET}/${REQUIRED_RELEASE}`) {
      throw new Error(`P6.2-A tile ${tile.id} is not pinned to ${REQUIRED_DATASET}/${REQUIRED_RELEASE}.`);
    }
  }

  return value;
}

export function isCopernicusGlo30Promoted(value = manifest) {
  try {
    validateCopernicusGlo30Manifest(value);
    return value.tiles.length > 0;
  } catch {
    return false;
  }
}
