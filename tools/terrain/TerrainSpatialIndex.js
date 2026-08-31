const EARTH_HALF_CIRCUMFERENCE_M = 20037508.342789244;

function finite(v) { return Number.isFinite(v); }
function assertBounds(bounds) { if (!bounds || ![bounds.minX,bounds.minY,bounds.maxX,bounds.maxY].every(finite) || bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) throw new Error("Invalid spatial bounds."); }

export function createTerrainSpatialIndex({ bounds, maxLod = 4 } = {}) {
  assertBounds(bounds);
  if (!Number.isInteger(maxLod) || maxLod < 0) throw new Error("maxLod must be a non-negative integer.");
  const root = Object.freeze({ ...bounds });
  return Object.freeze({ version: 1, maxLod, bounds: root, select: ({ cameraX, cameraY, viewDistance, maxTiles = 256 } = {}) => selectTerrainTiles({ bounds: root, maxLod, cameraX, cameraY, viewDistance, maxTiles }) });
}

function selectTerrainTiles({ bounds, maxLod, cameraX, cameraY, viewDistance, maxTiles }) {
  if (![cameraX,cameraY,viewDistance].every(finite) || viewDistance <= 0) throw new Error("Terrain selection requires finite camera position and positive view distance.");
  if (!Number.isInteger(maxTiles) || maxTiles < 1) throw new Error("maxTiles must be a positive integer.");
  const width = bounds.maxX - bounds.minX; const height = bounds.maxY - bounds.minY;
  const selected = [];
  for (let lod = maxLod; lod >= 0; lod -= 1) {
    const count = 2 ** lod;
    const tileWidth = width / count; const tileHeight = height / count;
    const radius = viewDistance / (2 ** (maxLod - lod));
    const minX = Math.max(0, Math.floor((cameraX - radius - bounds.minX) / tileWidth));
    const maxX = Math.min(count - 1, Math.floor((cameraX + radius - bounds.minX) / tileWidth));
    const minY = Math.max(0, Math.floor((cameraY - radius - bounds.minY) / tileHeight));
    const maxY = Math.min(count - 1, Math.floor((cameraY + radius - bounds.minY) / tileHeight));
    for (let y = minY; y <= maxY && selected.length < maxTiles; y += 1) for (let x = minX; x <= maxX && selected.length < maxTiles; x += 1) selected.push({ lod, x, y, bounds: { minX: bounds.minX + x * tileWidth, maxX: bounds.minX + (x + 1) * tileWidth, minY: bounds.minY + y * tileHeight, maxY: bounds.minY + (y + 1) * tileHeight } });
  }
  return selected;
}
