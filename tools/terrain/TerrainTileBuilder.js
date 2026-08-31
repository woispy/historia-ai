import { deriveNormals } from "./TerrainDemPipeline.js";
import { rasterPixelToWorld } from "./GeoTiffGeoreferencing.js";

function assertNonNegativeInteger(value, message) { if (!Number.isInteger(value) || value < 0) throw new Error(message); }
function assertPositiveInteger(value, message) { if (!Number.isInteger(value) || value < 1) throw new Error(message); }

export function buildTerrainTile({ raster, tileX, tileY, tileSize = 65, lod = 0 } = {}) {
  if (!raster || raster.crs === undefined || typeof raster.pixelToWorld !== "function") throw new Error("Terrain tile requires a canonical DEM raster.");
  assertNonNegativeInteger(tileX, "Terrain tile X must be a non-negative integer.");
  assertNonNegativeInteger(tileY, "Terrain tile Y must be a non-negative integer.");
  assertPositiveInteger(tileSize, "Terrain tile size must be a positive integer.");
  if (!Number.isInteger(lod) || lod < 0) throw new Error("Terrain tile LOD must be a non-negative integer.");
  const stride = 2 ** lod;
  const maxX = raster.width - 1; const maxY = raster.height - 1;
  const startX = tileX * (tileSize - 1) * stride; const startY = tileY * (tileSize - 1) * stride;
  if (startX > maxX || startY > maxY) throw new Error("Terrain tile origin lies outside the DEM raster.");
  const heights = new Float32Array(tileSize * tileSize); const worldPositions = new Float64Array(tileSize * tileSize * 2);
  for (let y = 0; y < tileSize; y += 1) for (let x = 0; x < tileSize; x += 1) {
    const sourceX = Math.min(startX + x * stride, maxX); const sourceY = Math.min(startY + y * stride, maxY);
    heights[y * tileSize + x] = raster.samples[sourceY * raster.width + sourceX];
    const world = rasterPixelToWorld({ georeferencing: { originX: raster.bounds.minX, originY: raster.bounds.maxY, pixelSizeX: (raster.bounds.maxX - raster.bounds.minX) / maxX, pixelSizeY: (raster.bounds.maxY - raster.bounds.minY) / maxY }, pixelX: sourceX, pixelY: sourceY });
    const index = (y * tileSize + x) * 2; worldPositions[index] = world.x; worldPositions[index + 1] = world.y;
  }
  const normals = deriveNormals(heights, tileSize, raster.resolutionMeters * stride);
  const x0 = worldPositions[0]; const x1 = worldPositions[(tileSize - 1) * 2];
  const y0 = worldPositions[1]; const y1 = worldPositions[(tileSize - 1) * tileSize * 2 + 1];
  return Object.freeze({ version: 1, tileX, tileY, lod, tileSize, stride, crs: raster.crs, bounds: Object.freeze({ minX: Math.min(x0, x1), minY: Math.min(y0, y1), maxX: Math.max(x0, x1), maxY: Math.max(y0, y1) }), heights, normals, worldPositions });
}
