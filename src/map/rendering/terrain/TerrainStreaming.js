import { terrainLodForDistance } from "./TerrainLod.js";
import { terrainTilesForBounds } from "./TerrainTile.js";

const LOD_TO_TILE_ZOOM = Object.freeze([0, 1, 2, 3, 5]);

export function terrainTileZoomForLod(lod) {
  if (!Number.isInteger(lod) || lod < 0 || lod > 4) throw new Error("Terrain LOD must be an integer in [0, 4].");
  return LOD_TO_TILE_ZOOM[lod];
}

export function planTerrainStreaming({ viewBounds, cameraDistance, maxTiles = 64 }) {
  if (!viewBounds || !Number.isFinite(cameraDistance)) throw new Error("Terrain streaming requires view bounds and camera distance.");
  if (!Number.isInteger(maxTiles) || maxTiles < 1) throw new Error("maxTiles must be a positive integer.");

  const lod = terrainLodForDistance(cameraDistance);
  const zoom = terrainTileZoomForLod(lod);
  const tiles = terrainTilesForBounds(viewBounds, zoom, lod >= 3 ? 1 : 0);
  if (tiles.length > maxTiles) {
    throw new Error(`Terrain streaming plan exceeds tile budget: ${tiles.length} > ${maxTiles}.`);
  }

  return Object.freeze({
    lod,
    zoom,
    tiles: Object.freeze(tiles),
    tileCount: tiles.length,
  });
}

export function mergeTerrainTilePlans(plans) {
  const unique = new Map();
  for (const plan of plans) {
    for (const tile of plan.tiles) unique.set(tile.id, tile);
  }
  return Object.freeze([...unique.values()]);
}
