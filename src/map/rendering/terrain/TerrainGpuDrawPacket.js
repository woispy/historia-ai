import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
import { validateTerrainTopologyCoverage } from "./TerrainTopologyCoverageValidator.js";
import { validateTerrainTriangleCoverage } from "./TerrainTriangleCoverageValidator.js";

export function createTerrainGpuDrawPacket({ tileId, lod, positions, indices, vertexCount, topologyVariant, edges, terrainTileId = tileId } = {}) {
  if (typeof tileId !== "string" || !tileId) throw new Error("Terrain GPU packet requires tileId.");
  if (!Number.isInteger(lod) || lod < 0) throw new Error("Terrain GPU packet requires a non-negative LOD.");
  if (!Number.isInteger(vertexCount) || vertexCount < 3) throw new Error("Terrain GPU packet vertexCount must be >= 3.");
  if (!(positions instanceof Float32Array) || positions.length !== vertexCount * 3) throw new Error("Terrain GPU packet positions must be XYZ Float32Array data.");
  if (positions.some(value => !Number.isFinite(value))) throw new Error("Terrain GPU packet positions must be finite.");
  validateTerrainIndexTopology({ indices, vertexCount });
  const size = Math.sqrt(vertexCount); if (!Number.isInteger(size)) throw new Error("Terrain GPU packet vertexCount must form a square grid.");
  const normalizedEdges = Object.freeze({ ...(edges ?? {}) });
  const coverage = validateTerrainTopologyCoverage({ indices, vertexCount, size, edges: normalizedEdges });
  if (!coverage.completeGridEdgeCoverage) throw new Error("Terrain GPU packet has incomplete topology coverage.");
  const xy = new Float32Array(vertexCount * 2); for (let i = 0; i < vertexCount; i += 1) { xy[i * 2] = positions[i * 3]; xy[i * 2 + 1] = positions[i * 3 + 1]; }
  const areaCoverage = validateTerrainTriangleCoverage({ indices, positions: xy, size });
  if (!areaCoverage.completeAreaCoverage) throw new Error("Terrain GPU packet has incomplete geometric coverage.");
  return Object.freeze({ tileId, lod, terrainTileId, topologyVariant: topologyVariant ?? "base", positions, indices, vertexCount, indexCount: indices.length, edges: normalizedEdges, coverage, areaCoverage });
}
