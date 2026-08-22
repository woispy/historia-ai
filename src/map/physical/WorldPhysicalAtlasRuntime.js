import {
  buildWorldPath,
  collectWorldLandPolygons,
  normalizeGeometryModule,
} from "./WorldLandMask.js";

/**
 * Heavy generated Natural Earth geometry is deliberately isolated behind a
 * second module boundary. WorldPhysicalAtlas.js contains only stable metadata;
 * this module is loaded when the physical world renderer actually needs land.
 */
const geometryModules = import.meta.glob(
  "../../world/map/assets/geometry/geometry_country_*.json",
  { eager: true, import: "default" },
);

export { normalizeGeometryModule };

export const WORLD_LAND_POLYGONS = Object.freeze(
  collectWorldLandPolygons(geometryModules),
);

export const WORLD_LAND_PATH = buildWorldPath(WORLD_LAND_POLYGONS);
