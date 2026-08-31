import { TERRAIN_EDGE, classifyNeighborLod } from "./TerrainTileSeams.js";

function assertTile(tile) { if (!tile || !Number.isInteger(tile.tileSize) || tile.tileSize < 2 || !Number.isInteger(tile.lod) || tile.lod < 0) throw new Error("Invalid terrain tile."); }
function vertexIndex(x, y, n) { return y * n + x; }

export function buildTerrainIndexBuffer({ tile, neighbors = {} } = {}) {
  assertTile(tile);
  const n = tile.tileSize;
  const seam = {};
  for (const edge of Object.values(TERRAIN_EDGE)) {
    const neighbor = neighbors[edge];
    seam[edge] = neighbor == null ? "boundary" : classifyNeighborLod(tile.lod, neighbor.lod);
  }
  const indices = [];
  const push = (a, b, c) => { indices.push(a, b, c); };
  for (let y = 0; y < n - 1; y += 1) {
    for (let x = 0; x < n - 1; x += 1) {
      const west = x === 0; const east = x === n - 2; const north = y === 0; const south = y === n - 2;
      const skipNorth = north && seam.north === "neighbor-coarser" && x % 2 === 1;
      const skipWest = west && seam.west === "neighbor-coarser" && y % 2 === 1;
      const skipSouth = south && seam.south === "neighbor-coarser" && x % 2 === 1;
      const skipEast = east && seam.east === "neighbor-coarser" && y % 2 === 1;
      const a = vertexIndex(x, y, n); const b = vertexIndex(x + 1, y, n); const c = vertexIndex(x + 1, y + 1, n); const d = vertexIndex(x, y + 1, n);
      if (!(skipNorth || skipWest)) push(a, b, d);
      if (!(skipSouth || skipEast)) push(b, c, d);
    }
  }
  return Object.freeze({ vertexCount: n * n, indexCount: indices.length, indices: Uint32Array.from(indices), seam: Object.freeze(seam) });
}
