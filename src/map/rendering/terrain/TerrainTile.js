const WORLD_MIN_X = -180;
const WORLD_MAX_X = 180;
const WORLD_MIN_Y = -90;
const WORLD_MAX_Y = 90;

export const TERRAIN_TILE_SIZE_DEGREES = 10;
export const TERRAIN_TILE_ZOOM_RANGE = Object.freeze({ min: 0, max: 5 });

function wrapTileX(x, zoom) {
  const count = 2 ** zoom;
  return ((x % count) + count) % count;
}

function clampTileY(y, zoom) {
  const count = 2 ** zoom;
  return Math.max(0, Math.min(count - 1, y));
}

export function makeTerrainTileKey(level, x, y) {
  if (!Number.isInteger(level) || level < 0 || level > 5) throw new Error("Terrain tile zoom must be an integer in [0, 5].");
  const count = 2 ** level;
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error("Terrain tile coordinates must be integers.");
  const tx = wrapTileX(x, level);
  const ty = clampTileY(y, level);
  if (ty !== y) throw new Error("Terrain tile Y is outside the world extent.");
  return Object.freeze({ level, x: tx, y: ty, id: `${level}/${tx}/${ty}` });
}

export function terrainTileBounds(tile) {
  const count = 2 ** tile.level;
  const width = (WORLD_MAX_X - WORLD_MIN_X) / count;
  const height = (WORLD_MAX_Y - WORLD_MIN_Y) / count;
  return Object.freeze({
    minX: WORLD_MIN_X + tile.x * width,
    minY: WORLD_MIN_Y + tile.y * height,
    maxX: WORLD_MIN_X + (tile.x + 1) * width,
    maxY: WORLD_MIN_Y + (tile.y + 1) * height,
  });
}

export function terrainTilesForBounds(bounds, zoom, padding = 1) {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 5) throw new Error("Terrain tile zoom must be an integer in [0, 5].");
  const count = 2 ** zoom;
  const width = (WORLD_MAX_X - WORLD_MIN_X) / count;
  const height = (WORLD_MAX_Y - WORLD_MIN_Y) / count;
  const minX = Math.floor((bounds.minX - WORLD_MIN_X) / width) - padding;
  const maxX = Math.floor((bounds.maxX - WORLD_MIN_X) / width) + padding;
  const minY = Math.floor((bounds.minY - WORLD_MIN_Y) / height) - padding;
  const maxY = Math.floor((bounds.maxY - WORLD_MIN_Y) / height) + padding;
  const tiles = [];
  for (let y = Math.max(0, minY); y <= Math.min(count - 1, maxY); y += 1) {
    for (let x = minX; x <= maxX; x += 1) tiles.push(makeTerrainTileKey(zoom, x, y));
  }
  return tiles;
}

export const TERRAIN_TILE_WORLD_BOUNDS = Object.freeze({
  minX: WORLD_MIN_X,
  minY: WORLD_MIN_Y,
  maxX: WORLD_MAX_X,
  maxY: WORLD_MAX_Y,
});
