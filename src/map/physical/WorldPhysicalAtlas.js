/**
 * Historia AI — World physical geography authority metadata.
 *
 * Generated Natural Earth geometry is intentionally not imported here. The
 * geometry lives in WorldPhysicalAtlasRuntime.js and is loaded only by the
 * physical map renderer. This prevents the global land dataset from becoming
 * part of the application bootstrap bundle.
 */

export const WORLD_PHYSICAL_BOUNDS = Object.freeze({
  minX: -180,
  minY: -90,
  maxX: 180,
  maxY: 90,
});

export const WORLD_PHYSICAL_ATLAS = Object.freeze({
  version: 2,
  authority: "natural-earth-derived-country-land-assets",
  coordinateSystem: "EPSG:4326",
  bounds: WORLD_PHYSICAL_BOUNDS,
  water: {
    fill: "#102c35",
    coastline: "#9db7ad",
  },
  land: {
    baseFill: "#283229",
  },
});
