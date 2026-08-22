import { selectIntersectingSpatialRegions } from "../../../map/spatial/SpatialRegionSelector.js";

export function selectHistoricalRuntimeRegionsByBounds(manifest, bounds, maxRegions = Infinity) {
  if (!manifest || !Array.isArray(manifest.regions)) {
    throw new Error("Historical runtime manifest must contain regions.");
  }

  return selectIntersectingSpatialRegions(manifest.regions, bounds, maxRegions);
}
