import hydrography from "./generated/anatolia-hydrography-10m.json" with { type: "json" };
import { ANATOLIA_PHYSICAL_ATLAS } from "./AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "./AnatoliaProvinceMetadata.js";
import { applyAnatoliaProvinceCartographicOverrides } from "./AnatoliaProvinceCartographicOverrides.js";

// Cartographic centroid corrections are applied before the historical Phase 2D
// geometry builder consumes province metadata. These are presentation anchors,
// not political ownership or cadastral boundary mutations.
applyAnatoliaProvinceCartographicOverrides(ANATOLIA_PROVINCE_METADATA);

function normalizeLake(feature) {
  return {
    id: feature.id,
    name: feature.name,
    nameEn: feature.nameEn,
    rank: feature.rank,
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

function normalizeCartographicLabels(labels) {
  return labels.map((label) => (
    label.kind === "sea"
      ? { ...label, maxZoom: Math.max(label.maxZoom ?? 0, 8) }
      : label
  ));
}

const generatedLakes = hydrography.lakes.map(normalizeLake);
const generatedRivers = hydrography.rivers.map(normalizeRiver);

// The curated atlas still owns broad physical context (coastline, seas,
// channels, islands, terrain and labels), but its historical lake/river arrays
// are legacy compatibility data. Generated 10m hydrography is the sole runtime
// authority for those two feature classes. Runtime label policy is applied here
// so physical source data stays immutable while presentation remains stable.
const {
  lakes: _legacyLakes,
  rivers: _legacyRivers,
  labels: _atlasLabels,
  ...staticPhysicalAtlas
} = ANATOLIA_PHYSICAL_ATLAS;

void _legacyLakes;
void _legacyRivers;

export const ANATOLIA_PHYSICAL_ATLAS_RUNTIME = Object.freeze({
  ...staticPhysicalAtlas,
  labels: Object.freeze(normalizeCartographicLabels(_atlasLabels ?? [])),
  hydrography: Object.freeze({
    source: hydrography.source,
    version: hydrography.version,
    projection: hydrography.projection,
  }),
  lakes: Object.freeze(generatedLakes),
  rivers: Object.freeze(generatedRivers),
});
