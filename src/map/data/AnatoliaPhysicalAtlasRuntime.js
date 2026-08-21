import hydrography from "./generated/anatolia-hydrography-10m.json" with { type: "json" };
import { ANATOLIA_PHYSICAL_ATLAS } from "./AnatoliaPhysicalAtlas.js";

function normalizeLake(feature) {
  return {
    id: feature.id,
    name: feature.name,
    nameEn: feature.nameEn,
    rank: feature.rank,
    coordinates: feature.rings,
    rings: feature.rings,
    bounds: feature.bounds,
    geometrySource: "natural-earth-10m",
  };
}

function normalizeRiver(feature) {
  return {
    id: feature.id,
    name: feature.name,
    nameEn: feature.nameEn,
    rank: feature.rank,
    coordinates: feature.coordinates,
    bounds: feature.bounds,
    geometrySource: "natural-earth-10m",
  };
}

const generatedLakes = hydrography.lakes.map(normalizeLake);
const generatedRivers = hydrography.rivers.map(normalizeRiver);

export const ANATOLIA_PHYSICAL_ATLAS_RUNTIME = Object.freeze({
  ...ANATOLIA_PHYSICAL_ATLAS,
  hydrography: Object.freeze({
    source: hydrography.source,
    version: hydrography.version,
    projection: hydrography.projection,
  }),
  lakes: Object.freeze(generatedLakes),
  rivers: Object.freeze(generatedRivers),
});
