const ASSET_KEYS = Object.freeze(["heightmap", "normal", "splatRgba", "splatSnow", "landMask"]);
function nonEmpty(value, name) { if (typeof value !== "string" || !value.trim()) throw new Error(`${name} must be a non-empty asset path.`); return value; }

export function createTerrainAssetManifest({ tileId, sourceId, sourceUrl, attribution, crs, bounds, dimensions, resolution, assets } = {}) {
  nonEmpty(tileId, "tileId"); nonEmpty(sourceId, "sourceId"); nonEmpty(sourceUrl, "sourceUrl"); nonEmpty(attribution, "attribution"); nonEmpty(crs, "crs");
  if (!bounds || !["minX","minY","maxX","maxY"].every((key) => Number.isFinite(bounds[key])) || bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) throw new Error("Terrain asset bounds are invalid.");
  if (!dimensions || !Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height) || dimensions.width < 2 || dimensions.height < 2) throw new Error("Terrain asset dimensions are invalid.");
  if (!Number.isFinite(resolution) || resolution <= 0) throw new Error("Terrain asset resolution must be positive.");
  if (!assets || typeof assets !== "object") throw new Error("Terrain asset paths are required.");
  const normalizedAssets = {}; for (const key of ASSET_KEYS) normalizedAssets[key] = nonEmpty(assets[key], `assets.${key}`);
  return Object.freeze({ tileId, sourceId, sourceUrl, attribution, crs, bounds: Object.freeze({ ...bounds }), dimensions: Object.freeze({ width: dimensions.width, height: dimensions.height }), resolution, assets: Object.freeze(normalizedAssets) });
}

export function validateTerrainAssetManifest(manifest) { createTerrainAssetManifest(manifest); return true; }
export { ASSET_KEYS };
