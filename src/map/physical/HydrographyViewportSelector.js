const DEFAULT_MAX_TILES = 8;

function assertManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.regions)) {
    throw new Error("Invalid hydrography region manifest");
  }
}

function normalizeBounds(bounds) {
  if (Array.isArray(bounds) && bounds.length === 4) {
    const [minLon, minLat, maxLon, maxLat] = bounds.map(Number);
    if ([minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return { minLon, minLat, maxLon, maxLat };
  }
  if (bounds && [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat].every(Number.isFinite)) {
    return { minLon: bounds.minLon, minLat: bounds.minLat, maxLon: bounds.maxLon, maxLat: bounds.maxLat };
  }
  throw new Error("Invalid hydrography region bounds");
}

function normalizeViewport(viewport) {
  const { minLon, maxLon, minLat, maxLat } = viewport || {};
  if (![minLon, maxLon, minLat, maxLat].every(Number.isFinite)) throw new Error("Invalid hydrography viewport");
  return {
    minLon: Math.min(minLon, maxLon),
    maxLon: Math.max(minLon, maxLon),
    minLat: Math.min(minLat, maxLat),
    maxLat: Math.max(minLat, maxLat),
  };
}

function intersects(a, b) {
  return a.minLon <= b.maxLon && a.maxLon >= b.minLon && a.minLat <= b.maxLat && a.maxLat >= b.minLat;
}

export function selectHydrographyRegions(manifest, viewport, maxTiles = DEFAULT_MAX_TILES) {
  assertManifest(manifest);
  const normalized = normalizeViewport(viewport);
  if (!Number.isInteger(maxTiles) || maxTiles < 1) throw new Error("maxTiles must be a positive integer");

  const candidates = manifest.regions
    .filter(Boolean)
    .map((region) => ({ ...region, normalizedBounds: normalizeBounds(region.bounds) }))
    .filter((region) => intersects(region.normalizedBounds, normalized))
    .sort((a, b) => a.id.localeCompare(b.id));

  return candidates.slice(0, maxTiles).map(({ id }) => id);
}
