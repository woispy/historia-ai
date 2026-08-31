import { resolveCopernicusDemSource } from "./CopernicusDemSource.js";

export const TERRAIN_DATA_CONTRACT_VERSION = 1;

export function createTerrainDataContract({ demInstance = "COPERNICUS_90", sourceTiles, outputGrid }) {
  const dem = resolveCopernicusDemSource(demInstance);
  if (!Array.isArray(sourceTiles) || sourceTiles.length === 0) {
    throw new Error("Terrain data contract requires at least one authoritative DEM source tile.");
  }
  if (!outputGrid?.crs || !Number.isFinite(outputGrid?.resolutionMeters)) {
    throw new Error("Terrain data contract requires output CRS and resolution.");
  }
  return Object.freeze({
    version: TERRAIN_DATA_CONTRACT_VERSION,
    authority: "Copernicus Data Space Ecosystem",
    source: Object.freeze({ ...dem }),
    sourceTiles: Object.freeze([...sourceTiles]),
    outputGrid: Object.freeze({
      crs: outputGrid.crs,
      resolutionMeters: outputGrid.resolutionMeters,
      interpolation: outputGrid.interpolation ?? "bilinear",
    }),
    derivedLayers: Object.freeze([
      "heightmap",
      "normal-from-height",
      "splat-from-authoritative-inputs",
      "physical-land-mask",
    ]),
    rule: "No invented elevation or physical boundary geometry is permitted in generated terrain assets.",
  });
}
