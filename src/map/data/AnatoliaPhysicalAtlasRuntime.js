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
    canonicalId: feature.canonicalId ?? null,
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

// The curated atlas still owns broad physical context (coastline, seas,
// channels, islands, terrain and labels), but its historical lake/river arrays
// are legacy compatibility data. Generated 10m hydrography is the sole runtime
// authority for those two feature classes. Keep the exclusion explicit here so
// future callers cannot accidentally consume the legacy arrays through spread.
const {
  lakes: _legacyLakes,
  rivers: _legacyRivers,
  ...staticPhysicalAtlas
} = ANATOLIA_PHYSICAL_ATLAS;

void _legacyLakes;
void _legacyRivers;

export const ANATOLIA_PHYSICAL_ATLAS_RUNTIME = Object.freeze({
  ...staticPhysicalAtlas,
  hydrography: Object.freeze({
    source: hydrography.source,
    version: hydrography.version,
    projection: hydrography.projection,
  }),
  lakes: Object.freeze(generatedLakes),
  rivers: Object.freeze(generatedRivers),
});
