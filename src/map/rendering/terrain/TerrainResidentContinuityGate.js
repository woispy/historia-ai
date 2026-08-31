import { assertTerrainTileContinuity } from "./TerrainTileContinuity.js";

export function createTerrainResidentContinuityGate({ getResidentTile, tolerance = 0 } = {}) {
  if (typeof getResidentTile !== "function") throw new Error("Terrain continuity gate requires a resident tile lookup.");
  return Object.freeze({
    validate(tileId, neighbors = {}) {
      const tile = getResidentTile(tileId);
      if (!tile) return Object.freeze({ drawable: false, reason: "tile-not-resident", checks: Object.freeze([]) });
      const checks = [];
      for (const [edge, neighborId] of Object.entries(neighbors)) {
        if (!neighborId) continue;
        const neighbor = getResidentTile(neighborId);
        if (!neighbor) return Object.freeze({ drawable: false, reason: "neighbor-not-resident", edge, neighborId, checks: Object.freeze(checks) });
        const opposite = { west: "east", east: "west", north: "south", south: "north" }[edge];
        const result = assertTerrainTileContinuity(tile, neighbor, { edgeA: edge, edgeB: opposite, tolerance });
        checks.push(Object.freeze({ edge, neighborId, maxDifference: result.maxDifference }));
      }
      return Object.freeze({ drawable: true, reason: "continuous", checks: Object.freeze(checks) });
    },
  });
}
