/**
 * Historia AI — grand-strategy cartography presentation model.
 *
 * LOD is the single source of truth for map rendering. Far views are
 * intentionally country-scale and cheap; province/city detail is only
 * mounted when the camera is close enough to justify it.
 */

export const MAP_LOD = Object.freeze({
  world: Object.freeze({ min: 1, max: 1.20 }),
  regional: Object.freeze({ min: 1.20, max: 1.85 }),
  province: Object.freeze({ min: 1.85, max: 2.65 }),
  city: Object.freeze({ min: 2.65, max: 3.50 }),
  detailed: Object.freeze({ min: 3.50, max: 96 }),
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
  return zoom >= 1 && zoom < 1.85;
}

export function shouldShowStrategicCorridors(zoom = 1) {
  return zoom >= 1.85;
}

export function shouldShowStrategicPasses(zoom = 1) {
  return zoom >= 2.45;
}

export function getPhysicalDetailProfile(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    rivers: lod !== "world",
    // Natural Earth 10m is now the physical river authority. Major rivers are
    // sufficient for the regional overview; every source segment is revealed
    // from province LOD onward without inventing or resampling its geometry.
    minorRivers: lod === "province" || lod === "city" || lod === "detailed",
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
    boundaryOpacity: lod === "world" ? 0 : lod === "regional" ? 0.34 : lod === "province" ? 0.56 : 0.70,
    fillOpacity: lod === "world" ? 0.84 : 1,
  });
}

export function getCityLabelPolicy(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    maxLabels: lod === "world" ? 3 : lod === "regional" ? 7 : lod === "province" ? 12 : lod === "city" ? 18 : 22,
    showTowns: lod === "province" || lod === "city" || lod === "detailed",
    showVillages: lod === "detailed",
  });
}

export function getPhysicalPresentation(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    terrainOpacity: 0,
    riverOpacity: lod === "regional" ? 0.42 : lod === "province" ? 0.58 : 0.72,
    mountainOpacity: lod === "regional" ? 0.05 : lod === "province" ? 0.10 : 0.14,
    lakeOpacity: lod === "regional" ? 0.56 : lod === "province" ? 0.68 : 0.76,
  });
}

export function getPhysicalStrokeProfile(zoom = 1) {
  const lod = getMapLod(zoom);
  if (lod === "regional") {
    return Object.freeze({ river: 1.0, minorRiver: 0.70, mountain: 0.76, minorMountain: 0.60, lake: 0.82 });
  }
  if (lod === "province") {
    return Object.freeze({ river: 1.18, minorRiver: 0.78, mountain: 0.86, minorMountain: 0.66, lake: 0.90 });
  }
  if (lod === "city" || lod === "detailed") {
    return Object.freeze({ river: 1.35, minorRiver: 0.86, mountain: 0.96, minorMountain: 0.70, lake: 1.00 });
  }
  return Object.freeze({ river: 0.88, minorRiver: 0.62, mountain: 0.68, minorMountain: 0.54, lake: 0.76 });
}
