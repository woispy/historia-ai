export function normalizeGeometryModule(module) {
  return module?.default ?? module ?? null;
}

export function isPhysicalLandGeometry(geometry) {
  if (!geometry?.id || !Array.isArray(geometry?.polygons)) return false;
  if (geometry.id === "geometry_country_ata") return false;
  if (geometry.name === "Antarctica") return false;
  return true;
}

export function collectWorldLandPolygons(modules = {}) {
  return Object.values(modules)
    .map(normalizeGeometryModule)
    .filter(isPhysicalLandGeometry)
    .flatMap((geometry) => geometry.polygons)
    .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3);
}

export function buildWorldPath(polygons = []) {
  return polygons
    .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3)
    .map((polygon) => {
      const [first, ...rest] = polygon;
      return [
        `M ${first[0]} ${first[1]}`,
        ...rest.map(([x, y]) => `L ${x} ${y}`),
        "Z",
      ].join(" ");
    })
    .join(" ");
}
