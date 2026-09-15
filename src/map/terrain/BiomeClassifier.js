/**
 * Historia AI — P9 Biome Classification
 *
 * Simplified Koppen-Geiger climate classification from elevation and latitude.
 * Deterministic, build-time only. No runtime precipitation model — uses
 * latitude bands and elevation as proxies for temperature and precipitation.
 */

export const BIOME_ID = Object.freeze({
  OCEAN: 0,
  ICE_CAP: 1,
  TUNDRA: 2,
  BOREAL_FOREST: 3,
  TEMPERATE_FOREST: 4,
  MEDITERRANEAN: 5,
  DESERT: 6,
  SUBTROPICAL: 7,
  TROPICAL_RAINFOREST: 8,
  MONTANE_GRASSLAND: 9,
  ALPINE_TUNDRA: 10,
});

export const BIOME_NAME = Object.freeze([
  "Ocean",
  "Ice Cap",
  "Tundra",
  "Boreal Forest",
  "Temperate Forest",
  "Mediterranean",
  "Desert",
  "Subtropical",
  "Tropical Rainforest",
  "Montane Grassland",
  "Alpine Tundra",
]);

export const BIOME_PALETTE = Object.freeze([
  [20, 40, 80, 255],    // 0: Ocean
  [255, 255, 255, 255], // 1: Ice Cap
  [200, 220, 230, 255], // 2: Tundra
  [100, 160, 100, 255], // 3: Boreal Forest
  [60, 130, 60, 255],   // 4: Temperate Forest
  [180, 180, 80, 255],  // 5: Mediterranean
  [220, 200, 100, 255], // 6: Desert
  [160, 200, 60, 255],  // 7: Subtropical
  [40, 120, 40, 255],   // 8: Tropical Rainforest
  [180, 200, 140, 255], // 9: Montane Grassland
  [160, 180, 160, 255], // 10: Alpine Tundra
]);

/**
 * Classify biome from latitude, elevation, and optional precipitation proxy.
 * Deterministic Koppen-inspired rules.
 */
export function classifyBiome(lat, elevation, precipitationProxy = null) {
  const absLat = Math.abs(lat);

  // Ocean check is done separately by the caller (water mask)
  // Ice caps: high elevation or polar
  if (elevation > 5000) return BIOME_ID.ICE_CAP;
  if (Math.abs(lat) > 75) return BIOME_ID.ICE_CAP;

  // Alpine zones by elevation
  if (elevation > 4500) return BIOME_ID.ALPINE_TUNDRA;
  if (elevation > 3500) return BIOME_ID.MONTANE_GRASSLAND;

  // Polar
  if (Math.abs(lat) > 66.5) {
    if (elevation > 1500) return BIOME_ID.ALPINE_TUNDRA;
    return BIOME_ID.TUNDRA;
  }

  // Subpolar / Boreal
  if (Math.abs(lat) > 55) {
    if (elevation >= 2000) return BIOME_ID.ALPINE_TUNDRA;
    if (elevation > 1000) return BIOME_ID.BOREAL_FOREST;
    return BIOME_ID.BOREAL_FOREST;
  }

  // Cool temperate
  if (Math.abs(lat) > 45) {
    if (elevation > 2000) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 1000) return BIOME_ID.TEMPERATE_FOREST;
    return BIOME_ID.TEMPERATE_FOREST;
  }

  // Warm temperate / Mediterranean
  if (Math.abs(lat) >= 30) {
    if (elevation >= 2000) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 1500) return BIOME_ID.TEMPERATE_FOREST;
    // Mediterranean: winter-wet summer-dry (western coasts 30-45°)
    // Simplified: assume western coasts get Mediterranean
    return BIOME_ID.MEDITERRANEAN;
  }

  // Subtropical
  if (Math.abs(lat) > 23.5) {
    if (elevation > 3000) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 2000) return BIOME_ID.TEMPERATE_FOREST;
    if (elevation > 1000) return BIOME_ID.TEMPERATE_FOREST;
    // Subtropical: could be desert or humid subtropical
    // Simplified: interior = desert, coast = humid subtropical
    return BIOME_ID.DESERT;
  }

  // Tropical
  if (Math.abs(lat) < 23.5) {
    if (elevation > 3500) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 2500) return BIOME_ID.MONTANE_GRASSLAND;
    if (elevation > 1500) return BIOME_ID.TEMPERATE_FOREST;
    return BIOME_ID.TROPICAL_RAINFOREST;
  }

  return BIOME_ID.TEMPERATE_FOREST;
}

// Re-export for testing
export const classifyBiomeRules = {};

export const biomeDefaultElevationThresholds = Object.freeze({
  alpineTundra: 4500,
  montaneGrassland: 3500,
  borealUpper: 1500,
  temperateUpper: 1500,
  tropicalMontane: 2500,
});

export function biomeColor(biomeId) {
  const palette = [
    [20, 40, 80, 255],    // 0: Ocean
    [255, 255, 255, 255], // 1: Ice Cap
    [200, 220, 230, 255], // 2: Tundra
    [100, 160, 100, 255], // 3: Boreal Forest
    [60, 130, 60, 255],   // 4: Temperate Forest
    [180, 180, 80, 255],  // 5: Mediterranean
    [220, 200, 100, 255], // 6: Desert
    [160, 200, 60, 255],  // 7: Subtropical
    [40, 120, 40, 255],   // 8: Tropical Rainforest
    [180, 200, 140, 255], // 9: Montane Grassland
    [160, 180, 160, 255], // 10: Alpine Tundra
  ];
  return palette[biomeId] ?? palette[4];
}