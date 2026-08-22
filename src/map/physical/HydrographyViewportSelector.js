import { selectIntersectingSpatialRegions } from "../spatial/SpatialRegionSelector.js";

const DEFAULT_MAX_TILES = 8;

function assertManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.regions)) {
    throw new Error("Invalid hydrography region manifest");
  }
}

function toSpatialBounds(bounds, label) {
  if (Array.isArray(bounds) && bounds.length === 4) {
    const [minLon, minLat, maxLon, maxLat] = bounds.map(Number);
    if ([minLon, minLat, maxLon, maxLat].every(Number.isFinite)) {
      return { minX: minLon, minY: minLat, maxX: maxLon, maxY: maxLat };
    }
  }

  if (bounds && [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat].every(Number.isFinite)) {
    return {
      minX: bounds.minLon,
      minY: bounds.minLat,
      maxX: bounds.maxLon,
      maxY: bounds.maxLat,
    };
  }

  throw new Error(`Invalid hydrography ${label}`);
}

export function selectHydrographyRegions(manifest, viewport, maxTiles = DEFAULT_MAX_TILES) {
  assertManifest(manifest);
  if (!Number.isInteger(maxTiles) || maxTiles < 1) throw new Error("maxTiles must be a positive integer");

  return selectIntersectingSpatialRegions(
    manifest.regions.map((region) => ({ ...region, bounds: toSpatialBounds(region.bounds, "region bounds") })),
    toSpatialBounds(viewport, "viewport"),
    maxTiles,
  );
}
