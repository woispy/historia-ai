/**
 * Historia AI — Grand-strategy cartography model.
 *
 * Phase 2E–2H centralises map presentation rules so physical geography,
 * strategic routes, city labels and camera LOD use one deterministic scale.
 */

export const MAP_LOD = Object.freeze({
  world: Object.freeze({ min: 0.75, max: 1.15 }),
  regional: Object.freeze({ min: 1.15, max: 1.75 }),
  province: Object.freeze({ min: 1.75, max: 2.55 }),
  city: Object.freeze({ min: 2.55, max: 3.35 }),
  detailed: Object.freeze({ min: 3.35, max: 48 }),
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
    waterChannels: lod === "province" || lod === "city" || lod === "detailed",
  });
}

export function getProvincePresentation(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    lod,
    showProvinceBoundaries: lod !== "world",
    boundaryOpacity: lod === "regional" ? 0.42 : lod === "province" ? 0.62 : 0.78,
    fillOpacity: lod === "world" ? 0.86 : 1,
  });
}

export function getCityLabelPolicy(zoom = 1) {
  const lod = getMapLod(zoom);
  return Object.freeze({
    maxLabels: lod === "world" ? 8 : lod === "regional" ? 28 : lod === "province" ? 64 : 120,
    showTowns: lod !== "world" && lod !== "regional",
    showVillages: lod === "detailed",
  });
}
