/**
 * Historia AI — grand-strategy cartography presentation model.
 *
 * Every visual subsystem reads the same LOD policy. The renderer can swap
 * between GPU political fills and vector detail without changing the physical
 * world authority underneath it.
 */

export const MAP_LOD = Object.freeze({
  world: Object.freeze({ min: 0.75, max: 1.15 }),
  regional: Object.freeze({ min: 1.15, max: 1.75 }),
  province: Object.freeze({ min: 1.75, max: 2.55 }),
  city: Object.freeze({ min: 2.55, max: 3.35 }),
  detailed: Object.freeze({ min: 3.35, max: 96 }),
});

export function getMapLod(zoom = 1) {
  if (zoom < MAP_LOD.regional.min) return "world";
  if (zoom < MAP_LOD.province.min) return "regional";
  if (zoom < MAP_LOD.city.min) return "province";
  if (zoom < MAP_LOD.detailed.min) return "city";
  return "detailed";
}

export function shouldUseGpuProvinceFill(zoom = 1) {
  const lod = getMapLod(zoom);
  return lod === "world" || lod === "regional";
}

export function getCityVisibilityTier(zoom = 1) {
  const lod = getMapLod(zoom);
  if (lod === "world") return "capital";
  if (lod === "regional") return "major";
  if (lod === "province") return "town";
  return "village";
}

export function shouldShowRegionLabels(zoom = 1) {
  return zoom >= 0.85 && zoom < 1.85;
}

export function shouldShowStrategicCorridors(zoom = 1) {
  return zoom >= 1.85;
}

export function shouldShowStrategicPasses(zoom = 1) {
  return zoom >= 2.35;
}

export function getPhysicalDetailProfile(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    rivers: lod !== "world",
    minorRivers: lod === "city" || lod === "detailed",
    mountains: lod !== "world",
    mountainLabels: lod === "city" || lod === "detailed",
    lakes: lod !== "world",
    physicalLabels: lod === "province" || lod === "city" || lod === "detailed",
    waterChannels: false,
  });
}

export function getProvincePresentation(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    lod,
    showProvinceBoundaries: lod !== "world",
    boundaryOpacity: lod === "world" ? 0.18 : lod === "regional" ? 0.38 : lod === "province" ? 0.56 : 0.70,
    fillOpacity: lod === "world" ? 0.86 : 1,
  });
}

export function getCityLabelPolicy(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    maxLabels: lod === "world" ? 5 : lod === "regional" ? 8 : lod === "province" ? 12 : lod === "city" ? 18 : 22,
    showTowns: lod === "province" || lod === "city" || lod === "detailed",
    showVillages: lod === "detailed",
  });
}

export function getPhysicalPresentation(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    terrainOpacity: 0,
    riverOpacity: lod === "regional" ? 0.46 : lod === "province" ? 0.60 : 0.72,
    mountainOpacity: lod === "regional" ? 0.06 : lod === "province" ? 0.10 : 0.14,
    lakeOpacity: lod === "regional" ? 0.58 : lod === "province" ? 0.68 : 0.76,
  });
}

export function getPhysicalStrokeProfile(zoom = 1) {
  const lod = getMapLod(zoom);
  if (lod === "regional") {
    return Object.freeze({ river: 1.05, minorRiver: 0.72, mountain: 0.78, minorMountain: 0.62, lake: 0.85 });
  }
  if (lod === "province") {
    return Object.freeze({ river: 1.20, minorRiver: 0.78, mountain: 0.88, minorMountain: 0.66, lake: 0.90 });
  }
  if (lod === "city" || lod === "detailed") {
    return Object.freeze({ river: 1.35, minorRiver: 0.86, mountain: 0.96, minorMountain: 0.70, lake: 1.00 });
  }
  return Object.freeze({ river: 0.90, minorRiver: 0.64, mountain: 0.70, minorMountain: 0.56, lake: 0.78 });
}
