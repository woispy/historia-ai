import { TERRAIN_LODS } from "./TerrainLod.js";

export const TERRAIN_ASSET_VERSION = 1;

export function createTerrainTileManifest({ tile, bounds, assets }) {
  if (!tile?.id) throw new Error("Terrain manifest requires a tile key.");
  if (!bounds || !["minX", "minY", "maxX", "maxY"].every((key) => Number.isFinite(bounds[key]))) {
    throw new Error("Terrain manifest requires finite tile bounds.");
  }
  if (!assets?.heightmap || !assets?.normal || !assets?.splatRgba || !assets?.splatSnow || !assets?.landMask) {
    throw new Error("Terrain manifest requires heightmap, normal, RGBA splat, snow splat and land-mask assets.");
  }
  return Object.freeze({
    version: TERRAIN_ASSET_VERSION,
    tile: tile.id,
    bounds: Object.freeze({ ...bounds }),
    lods: TERRAIN_LODS.map(({ level, grid }) => Object.freeze({ level, grid })),
    assets: Object.freeze({
      heightmap: assets.heightmap,
      normal: assets.normal,
      splatRgba: assets.splatRgba,
      splatSnow: assets.splatSnow,
      landMask: assets.landMask,
    }),
    topology: Object.freeze({
      authority: "shared-physical-land-mask",
      coastline: "physical-land-boundary",
      hydrology: "water-engine-topology",
    }),
  });
}

export function validateTerrainTileManifest(manifest) {
  if (!manifest || manifest.version !== TERRAIN_ASSET_VERSION) return false;
  if (!manifest.tile || !manifest.bounds || !manifest.assets) return false;
  return ["heightmap", "normal", "splatRgba", "splatSnow", "landMask"].every((key) => typeof manifest.assets[key] === "string");
}
