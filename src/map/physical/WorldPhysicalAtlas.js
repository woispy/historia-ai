/**
 * Historia AI — World physical geography authority.
 *
 * The physical layer is deliberately independent from historical ownership.
 * Repository geometry assets are Natural Earth-derived and are used only as
 * a stable global land/coast authority. Political history is stored elsewhere.
 */

import {
  buildWorldPath,
  collectWorldLandPolygons,
  normalizeGeometryModule,
} from "./WorldLandMask.js";

// Vite exposes import.meta.glob during the browser build. Node's ESM runtime
// does not. Keep the module importable by deterministic contract tests without
// weakening the browser asset path: the production bundler still evaluates the
// glob and supplies every generated geometry asset.
const geometryGlob = typeof import.meta.glob === "function" ? import.meta.glob : null;
const geometryModules = geometryGlob
  ? geometryGlob("../../world/map/assets/geometry/geometry_country_*.json", {
    eager: true,
    import: "default",
  })
  : {};

export { normalizeGeometryModule };

export const WORLD_LAND_POLYGONS = Object.freeze(
  collectWorldLandPolygons(geometryModules),
);

export const WORLD_PHYSICAL_BOUNDS = Object.freeze({
  minX: -180,
  minY: -90,
  maxX: 180,
  maxY: 90,
});

export const WORLD_PHYSICAL_ATLAS = Object.freeze({
  version: 1,
  authority: "natural-earth-derived-country-land-assets",
  coordinateSystem: "EPSG:4326",
  bounds: WORLD_PHYSICAL_BOUNDS,
  landPolygonCount: WORLD_LAND_POLYGONS.length,
  water: {
    fill: "#102c35",
    coastline: "#9db7ad",
  },
  land: {
    baseFill: "#283229",
  },
});

export const WORLD_LAND_PATH = buildWorldPath(WORLD_LAND_POLYGONS);
