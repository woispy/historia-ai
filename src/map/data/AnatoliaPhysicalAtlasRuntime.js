import { ANATOLIA_PHYSICAL_ATLAS } from "./AnatoliaPhysicalAtlas.js";

/**
 * Runtime metadata for the physical atlas.
 *
 * River/lake geometry is deliberately not imported here. It is a map-time
 * regional resource owned by RegionalHydrographyLayer. Keeping hydrography out
 * of this module prevents the monolithic 10m dataset from entering the map
 * dependency graph.
 */
export const ANATOLIA_PHYSICAL_ATLAS_RUNTIME = Object.freeze({
  ...ANATOLIA_PHYSICAL_ATLAS,
  hydrography: Object.freeze({
    source: "Natural Earth 10m",
    version: 1,
    projection: "EPSG:4326",
  }),
  lakes: Object.freeze([]),
  rivers: Object.freeze([]),
});
