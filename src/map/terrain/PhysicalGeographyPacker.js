/**
 * Historia AI — P9 Physical Geography Packer
 *
 * Packs terrain-aware physical geography (land, water, rivers, lakes, biome, terrain)
 * into the GPU province pack. Extends the existing ProvinceGpuPack with terrain attributes.
 */

import { buildIndexedProvincePack } from "../rendering/gpu/ProvinceGpuPackStable.js";
import { biomeFromLatElevation as classifyBiome, BIOME_PALETTE } from "./BiomeClassifier.js";

export const PHYSICAL_FEATURE_TYPE = Object.freeze({
  LAND: 1,
  WATER: 2,
  RIVER: 3,
  LAKE: 4,
  TERRAIN: 5,
});

export async function buildPhysicalGeographyPack(entries, options = {}) {
  const {
    tileSize = 10,
    quantization = 1e6,
    terrainProvider = null,
    includeRivers = true,
    includeBiome = true,
    includeTerrain = true,
  } = options;

  const physicalEntries = [];
  const provinceEntries = [];

  for (const entry of entries) {
    if (entry.featureType && entry.featureType !== "province") {
      physicalEntries.push(entry);
    } else {
      provinceEntries.push(entry);
    }
  }

  const provincePack = buildIndexedProvincePack(provinceEntries, { tileSize, quantization });

  if (physicalEntries.length === 0) return provincePack;

  const terrainData = includeTerrain && terrainProvider ? await sampleTerrainForFeatures(physicalEntries, terrainProvider) : null;
  const biomeData = includeBiome ? computeBiomeForFeatures(physicalEntries) : null;
  const riverWidths = includeRivers ? computeRiverWidths(physicalEntries) : null;

  return {
    ...provincePack,
    physicalFeatures: physicalEntries.map((entry, idx) => ({
      ...entry,
      terrain: terrainData ? terrainData[idx] : null,
      biome: biomeData ? biomeData[idx] : null,
      riverWidth: riverWidths ? riverWidths.get(entry.canonicalId) : null,
    })),
    biomePalette: BIOME_PALETTE,
  };
}

async function sampleTerrainForFeatures(entries, terrainProvider) {
  const results = [];
  for (const entry of entries) {
    if (!entry.geometry?.polygons) {
      results.push(null);
      continue;
    }
    const polygons = entry.geometry.polygons;
    const samples = [];
    for (const polygon of polygons) {
      for (const [lon, lat] of polygon) {
        const attrs = terrainProvider.computeAttributes(lon, lat);
        if (attrs) samples.push(attrs);
      }
    }
    if (samples.length === 0) {
      results.push(null);
      continue;
    }
    const avg = {
      elevation: samples.reduce((s, a) => s + a.elevation, 0) / samples.length,
      slopeDegrees: samples.reduce((s, a) => s + a.slopeDegrees, 0) / samples.length,
      aspectDegrees: samples.reduce((s, a) => s + a.aspectDegrees, 0) / samples.length,
      hillshade: samples.reduce((s, a) => s + a.hillshade, 0) / samples.length,
    };
    results.push(avg);
  }
  return results;
}

function computeBiomeForFeatures(entries) {
  const results = [];
  for (const entry of entries) {
    if (!entry.geometry?.polygons) {
      results.push({ biomeId: 0, color: [20, 40, 80, 255] });
      continue;
    }
    let totalLat = 0, count = 0;
    for (const polygon of entry.geometry.polygons) {
      for (const [, lat] of polygon) {
        totalLat += lat;
        count += 1;
      }
    }
    if (count === 0) {
      results.push({ biomeId: 0, color: [20, 40, 80, 255] });
      continue;
    }
    const elevation = entry.terrain?.elevation ?? 0;
    const biomeId = classifyBiome(totalLat / count, elevation);
    results.push({
      biomeId,
      color: BIOME_PALETTE[biomeId] ?? [60, 130, 60, 255],
    });
  }
  return results;
}

function computeRiverWidths(entries) {
  const riverEntries = entries.filter((e) => e.featureType === "river");
  if (riverEntries.length === 0) return new Map();

  const widths = new Map();
  for (const entry of riverEntries) {
    if (entry.geometry?.coordinates && entry.geometry.coordinates.length >= 2) {
      const coordCount = entry.geometry.coordinates.length;
      const width = Math.min(8000, Math.max(500, Math.sqrt(coordCount) * 500));
      widths.set(entry.canonicalId ?? entry.name, width);
    }
  }
  return widths;
}

export async function buildPhysicalGeographyDataset(assetEntries, options = {}) {
  const physicalEntries = assetEntries.filter((e) =>
    e.featureType && ["land", "water", "river", "lake", "mountain", "sea"].includes(e.featureType)
  );

  const provinceEntries = assetEntries.filter((e) => !e.featureType || e.featureType === "province");
  const pack = await buildPhysicalGeographyPack([...provinceEntries, ...physicalEntries], options);

  return {
    pack,
    physicalFeatures: physicalEntries.length,
    provinces: provinceEntries.length,
  };
}
