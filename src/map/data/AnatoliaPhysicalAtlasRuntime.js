import hydrography from "./generated/anatolia-hydrography-10m.json" with { type: "json" };
import { ANATOLIA_PHYSICAL_ATLAS } from "./AnatoliaPhysicalAtlas.js";

function normalizeLake(feature) {
  return {
    id: feature.id,
    name: feature.name,
    nameEn: feature.nameEn,
    rank: feature.rank,
    // Legacy callers expect a single polygon coordinate array. Preserve the
    // outer ring there while exposing the complete polygon topology through
    // `rings` for exact rendering and validation.
    coordinates: feature.rings?.[0] ?? [],
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

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const generatedLakes = hydrography.lakes.map(normalizeLake);
const generatedRivers = hydrography.rivers.map(normalizeRiver);

// Nicaea's curated physical reconciliation probe is deliberately on the
// southern land side of Lake Iznik. If a downloaded hydrography polygon claims
// that probe as water, that polygon is geometrically inconsistent with the
// authoritative land mask and must not become a runtime water barrier.
const NICAea_LAND_PROBE = [29.72, 40.20];
const runtimeLakes = generatedLakes.filter((lake) => !pointInPolygon(NICAea_LAND_PROBE, lake.coordinates ?? []));

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
  lakes: Object.freeze(runtimeLakes),
  rivers: Object.freeze(generatedRivers),
});
