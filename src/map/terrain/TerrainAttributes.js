/**
 * Historia AI — P9 Terrain Attribute Generator
 *
 * Computes per-vertex terrain attributes (elevation, slope, aspect, hillshade, biome)
 * for physical geography features using the Copernicus DEM.
 */

import { TerrainTileProvider, biomeFromLatElevation } from "./TerrainTileProvider.js";

/**
 * Terrain attribute schema per vertex: [elevation_km, slope_normalized, hillshade, biome_id]
 */
export const TERRAIN_ATTR_COMPONENTS = 4;

/**
 * Generate terrain attributes for a list of vertices (lon/lat pairs).
 * Returns Float32Array with 4 components per vertex: [elevation_km, slope_norm, hillshade, biome_id]
 */
export async function generateTerrainAttributes(vertices, terrainProvider) {
  if (!vertices || vertices.length === 0) return new Float32Array(0);
  if (vertices.length % 2 !== 0) throw new Error("vertices must be an even-length array of [lon, lat] pairs");

  const vertexCount = vertices.length / 2;
  const attrs = new Float32Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i += 1) {
    const lon = vertices[i * 2];
    const lat = vertices[i * 2 + 1];
    const attrs4 = await computeVertexTerrainAttributes(terrainProvider, lon, lat);
    const base = i * 4;
    attrs[base] = attrs4.elevationKm;
    attrs[base + 1] = attrs4.slopeNormalized;
    attrs[base + 2] = attrs4.hillshade;
    attrs[base + 3] = attrs4.biomeId;
  }
  return attrs;
}

async function computeVertexTerrainAttributes(terrainProvider, lon, lat) {
  const attrs = await terrainProvider.computeAttributes(lon, lat);
  if (!attrs) {
    // Fallback: no DEM data (ocean or missing tile)
    const biomeId = biomeFromLatElevation(lat, 0);
    return { elevationKm: 0, slopeNormalized: 0, hillshade: 0.3, biomeId };
  }
  const elevationKm = Math.max(0, attrs.elevation / 1000);
  const slopeNormalized = Math.min(1, attrs.slopeDegrees / 45);
  return {
    elevationKm,
    slopeNormalized: Math.min(1, attrs.slopeDegrees / 45),
    hillshade: attrs.hillshade,
    biomeId: attrs.biomeId ?? biomeFromLatElevation(lat, attrs.elevation),
  };
}

/**
 * Build terrain attributes for a physical geography pack.
 * Input: vertices array [lon, lat, lon, lat, ...] from the physical pack
 * Output: Float32Array with 4 components per vertex
 */
export async function buildTerrainAttributesForPack(pack, terrainProvider) {
  if (!pack.vertices || pack.vertices.length === 0) return new Float32Array(0);

  // Pack vertices are Float32Array [lon, lat, lon, lat, ...]
  return generateTerrainAttributes(pack.vertices, terrainProvider);
}

// Re-export from TerrainTileProvider for convenience
export { biomeFromLatElevation, generateBiomePalette } from "./TerrainTileProvider.js";