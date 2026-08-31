import { planTerrainStreaming } from "./TerrainStreaming.js";
import { buildTerrainAdjacency, planTerrainLodSeams } from "./TerrainTileAdjacency.js";
import { createTerrainDrawPlan } from "./TerrainDrawPlan.js";

function priorityForTile(tile, viewBounds, lod) { const cx = (viewBounds.minX + viewBounds.maxX) / 2; const cy = (viewBounds.minY + viewBounds.maxY) / 2; const dx = tile.x - cx; const dy = tile.y - cy; return (dx * dx + dy * dy) + lod * 0.01; }

export function createTerrainStreamingController({ residency, requestTile, maxTiles = 64 } = {}) {
  if (!residency || typeof residency.request !== "function" || typeof residency.get !== "function") throw new Error("Terrain streaming controller requires a residency cache.");
  if (typeof requestTile !== "function") throw new Error("Terrain streaming controller requires a tile request callback.");
  return Object.freeze({
    update({ viewBounds, cameraDistance } = {}) {
      const stream = planTerrainStreaming({ viewBounds, cameraDistance, maxTiles });
      const requested = [];
      for (const tile of stream.tiles) {
        const priority = priorityForTile(tile, viewBounds, stream.lod);
        const existing = residency.get(tile.id);
        if (!existing) { residency.request(tile.id, 0, priority); requestTile(tile, stream.lod); requested.push(tile.id); }
        else residency.touch(tile.id);
      }
      return Object.freeze({ lod: stream.lod, zoom: stream.zoom, tiles: stream.tiles, requested: Object.freeze(requested) });
    },
    buildDrawPlan({ tile, lod, lookup } = {}) {
      const adjacency = buildTerrainAdjacency(tile, lookup);
      const seamPlan = planTerrainLodSeams(lod, adjacency);
      const resident = residency.get(tile.id)?.state === "resident";
      return createTerrainDrawPlan({ tile, lod, adjacency: Object.fromEntries(Object.entries(seamPlan).map(([edge, seam]) => [edge, { lod: seam.neighborLod, resident: adjacency[edge]?.resident !== false }])), resident });
    },
  });
}
