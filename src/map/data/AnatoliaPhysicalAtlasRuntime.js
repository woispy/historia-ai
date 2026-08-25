import hydrography from "./generated/anatolia-hydrography-10m.json" with { type: "json" };
import { ANATOLIA_PHYSICAL_ATLAS } from "./AnatoliaPhysicalAtlas.js";

function normalizeLake(feature) {
  const rings = feature.rings;
  if (!Array.isArray(rings) || rings.length === 0) return [];

  // Natural Earth Polygon data is [ring, ...holes], while MultiPolygon data is
  // [[ring, ...holes], ...]. Runtime consumers intentionally operate on one
  // polygon component at a time so every caller receives a simple outer ring
  // plus its holes. This avoids treating a nested MultiPolygon array as if it
  // were a coordinate pair sequence during boundary and point-in-polygon
  // operations.
  const polygonComponents = Array.isArray(rings[0]?.[0]?.[0])
    ? rings
    : [rings];

  return polygonComponents
    .filter((component) => Array.isArray(component?.[0]) && component[0].length >= 3)
    .map((component, componentIndex) => ({
      id: polygonComponents.length === 1 ? feature.id : `${feature.id}-${componentIndex}`,
      name: feature.name,
      nameEn: feature.nameEn,
      rank: feature.rank,
      // Legacy callers expect a single outer polygon coordinate array.
      coordinates: component[0],
      // Keep the complete Polygon topology for exact rendering/validation.
      rings: component,
      bounds: feature.bounds,
      geometrySource: "natural-earth-10m",
    }));
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

const generatedLakes = hydrography.lakes.flatMap(normalizeLake);
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
