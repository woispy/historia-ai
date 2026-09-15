/**
 * Historia AI — P9 Biome Classification
 *
 * Simplified Koppen-Geiger climate classification from elevation and latitude.
 * Deterministic, build-time only. No runtime precipitation model — uses
 * latitude bands and elevation as proxies for temperature and precipitation.
 */

export const BIOME_ID = Object.freeze({ OCEAN: 0, ICE_CAP: 1, TUNDRA: 2, BOREAL_FOREST: 3, TEMPERATE_FOREST: 4, MEDITERRANEAN: 5, DESERT: 6, SUBTROPICAL: 7, TROPICAL_RAINFOREST: 8, MONTANE_GRASSLAND: 9, ALPINE_TUNDRA: 10 });
export const BIOME_NAME = Object.freeze(["Ocean", "Ice Cap", "Tundra", "Boreal Forest", "Temperate Forest", "Mediterranean", "Desert", "Subtropical", "Tropical Rainforest", "Montane Grassland", "Alpine Tundra"]);
export const BIOME_PALETTE = Object.freeze([[20, 40, 80, 255], [255, 255, 255, 255], [200, 220, 230, 255], [100, 160, 100, 255], [60, 130, 60, 255], [180, 180, 80, 255], [220, 200, 100, 255], [160, 200, 60, 255], [40, 120, 40, 255], [180, 200, 140, 255], [160, 180, 160, 255]]);

export function classifyBiome(lat, elevation, precipitationProxy = null) {
  const absLat = Math.abs(lat);
  void precipitationProxy;
  if (elevation > 5000) return BIOME_ID.ICE_CAP;
  if (absLat > 75) return BIOME_ID.ICE_CAP;
  if (elevation > 4500) return BIOME_ID.ALPINE_TUNDRA;
  if (elevation > 3500) return BIOME_ID.MONTANE_GRASSLAND;
  if (absLat > 66.5) return elevation > 1500 ? BIOME_ID.ALPINE_TUNDRA : BIOME_ID.TUNDRA;
  if (absLat > 55) return BIOME_ID.BOREAL_FOREST;
  if (absLat > 45) return elevation > 2000 ? BIOME_ID.MONTANE_GRASSLAND : BIOME_ID.TEMPERATE_FOREST;
  if (absLat >= 30) {
    if (elevation >= 2000) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 1500) return BIOME_ID.TEMPERATE_FOREST;
    return BIOME_ID.MEDITERRANEAN;
  }
  if (absLat > 23.5) {
    if (elevation > 3000) return BIOME_ID.MONTANE_GRASSLAND;
    return elevation > 1000 ? BIOME_ID.TEMPERATE_FOREST : BIOME_ID.DESERT;
  }
  if (absLat < 23.5) {
    if (elevation > 2500) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 1500) return BIOME_ID.TEMPERATE_FOREST;
    return BIOME_ID.TROPICAL_RAINFOREST;
  }
  return BIOME_ID.TEMPERATE_FOREST;
}

export const classifyBiomeRules = {};
export const biomeDefaultElevationThresholds = Object.freeze({ alpineTundra: 4500, montaneGrassland: 3500, borealUpper: 1500, temperateUpper: 1500, tropicalMontane: 2500 });

export function biomeColor(biomeId) {
  return BIOME_PALETTE[biomeId] ?? BIOME_PALETTE[4];
}
