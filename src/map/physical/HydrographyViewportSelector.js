const DEFAULT_MAX_TILES = 8;

function assertManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.regions)) {
    throw new Error('Invalid hydrography region manifest');
  }
}

function normalizeViewport(viewport) {
  const { minLon, maxLon, minLat, maxLat } = viewport || {};
  if (![minLon, maxLon, minLat, maxLat].every(Number.isFinite)) {
    throw new Error('Invalid hydrography viewport');
  }
  return {
    minLon: Math.min(minLon, maxLon),
    maxLon: Math.max(minLon, maxLon),
    minLat: Math.min(minLat, maxLat),
    maxLat: Math.max(minLat, maxLat),
  };
}

function intersects(a, b) {
  return a.minLon <= b.maxLon && a.maxLon >= b.minLon &&
    a.minLat <= b.maxLat && a.maxLat >= b.minLat;
}

export function selectHydrographyRegions(manifest, viewport, maxTiles = DEFAULT_MAX_TILES) {
  assertManifest(manifest);
  const normalized = normalizeViewport(viewport);
  if (!Number.isInteger(maxTiles) || maxTiles < 1) {
    throw new Error('maxTiles must be a positive integer');
  }

  const candidates = manifest.regions
    .filter((region) => region && intersects(region.bounds, normalized))
    .map((region) => ({
      id: region.id,
      bounds: region.bounds,
      area: Math.max(0, (region.bounds.maxLon - region.bounds.minLon) * (region.bounds.maxLat - region.bounds.minLat)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return candidates.slice(0, maxTiles).map(({ id }) => id);
}
