/**
 * Historia AI — grand-strategy cartography model.
 *
 * Presentation density is centralised here so the GPU political layer, SVG
 * topology, physical detail and city labels share one deterministic scale.
 * Broad hand-drawn terrain/water envelopes are intentionally disabled at
 * runtime; physical detail must never be able to paint over the authoritative
 * coastline mask.
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
    // Broad sea polygons can fight the GPU land mask. Water is now owned by
    // the mask/background, while rivers and lakes remain explicit details.
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
    maxLabels: lod === "world" ? 6 : lod === "regional" ? 10 : lod === "province" ? 16 : lod === "city" ? 22 : 28,
    showTowns: lod === "province" || lod === "city" || lod === "detailed",
    showVillages: lod === "detailed",
  });
}

export function getPhysicalPresentation(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    // Terrain regions are research metadata until they are rasterized through
    // the same land-mask compositor as political ownership.
    terrainOpacity: 0,
    riverOpacity: lod === "regional" ? 0.42 : lod === "province" ? 0.56 : 0.66,
    mountainOpacity: lod === "regional" ? 0.07 : lod === "province" ? 0.11 : 0.15,
    lakeOpacity: lod === "regional" ? 0.58 : lod === "province" ? 0.70 : 0.78,
  });
}
