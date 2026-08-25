import {
  buildWorldPath,
  collectWorldLandPolygons,
  normalizeGeometryModule,
} from "./WorldLandMask.js";

/**
 * Lightweight runtime loader for generated Natural Earth country geometry.
 * Geometry is loaded on demand rather than embedded eagerly into one bundle.
 */
const geometryLoaders = import.meta.glob(
  "../../world/map/assets/geometry/geometry_country_*.json",
  { import: "default" },
);

const geometryCache = new Map();

function geometryKeyFromCountryId(countryId) {
  return `../../world/map/assets/geometry/geometry_country_${String(countryId).toLowerCase()}.json`;
}

export { normalizeGeometryModule };

export async function loadWorldLandGeometry(countryIds = Object.keys(geometryLoaders).map((key) => key.match(/geometry_country_([^/]+)\.json$/)?.[1]).filter(Boolean)) {
  const ids = [...new Set(countryIds.map((id) => String(id).toLowerCase()))];
  const modules = await Promise.all(
    ids.map(async (countryId) => {
      const key = geometryKeyFromCountryId(countryId);
      const loader = geometryLoaders[key];
      if (!loader) return null;
      if (!geometryCache.has(countryId)) {
        geometryCache.set(countryId, loader());
      }
      const module = await geometryCache.get(countryId);
      return normalizeGeometryModule(module);
    }),
  );
  return modules.filter(Boolean);
}

export async function loadWorldLandPath(countryIds) {
  const polygons = await loadWorldLandGeometry(countryIds);
  return buildWorldPath(collectWorldLandPolygons(
    Object.fromEntries(polygons.map((polygon, index) => [`geometry_${index}`, polygon])),
  ));
}

export function clearWorldLandGeometryCache() {
  geometryCache.clear();
}
