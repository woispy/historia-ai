import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
import { validateTerrainTopologyCoverage } from "./TerrainTopologyCoverageValidator.js";

export function createTerrainGpuDrawPacket({ tileId, lod, positions, indices, vertexCount, topologyVariant, edges, terrainTileId = tileId } = {}) {
  if (typeof tileId !== "string" || !tileId) throw new Error("Terrain GPU packet requires tileId.");
  if (!Number.isInteger(lod) || lod < 0) throw new Error("Terrain GPU packet requires a non-negative LOD.");
  if (!(positions instanceof Float32Array) || positions.length !== vertexCount * 3) throw new Error("Terrain GPU packet positions must be XYZ Float32Array data.");
  if (!Number.isInteger(vertexCount) || vertexCount < 3) throw new Error("Terrain GPU packet vertexCount must be >= 3.");
  if (positions.some(value => !Number.isFinite(value))) throw new Error("Terrain GPU packet positions must be finite.");
  validateTerrainIndexTopology({ indices, vertexCount });
  const size = Math.sqrt(vertexCount); if (!Number.isInteger(size)) throw new Error("Terrain GPU packet vertexCount must form a square grid.");
  const coverage = validateTerrainTopologyCoverage({ indices, vertexCount, size });
  if (!coverage.completeGridEdgeCoverage) throw new Error("Terrain GPU packet has incomplete topology coverage.");
  const packet = { tileId, lod, terrainTileId, topologyVariant: topologyVariant ?? "base", positions, indices, vertexCount, indexCount: indices.length, edges: Object.freeze({ ...(edges ?? {}) }), coverage };
  return Object.freeze(packet);
}
