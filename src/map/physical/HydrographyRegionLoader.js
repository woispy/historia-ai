const DEFAULT_MANIFEST_URL = "/assets/hydrography-regions/manifest.json";

function assertManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.regions)) {
    throw new Error("Invalid hydrography region manifest");
  }
}

export function createHydrographyRegionLoader({
  fetchImpl = globalThis.fetch,
  manifestUrl = DEFAULT_MANIFEST_URL,
  maxCachedRegions = 8,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("HydrographyRegionLoader requires fetch");
  }

  let manifestPromise;
  const cache = new Map();

  const loadManifest = async () => {
    if (!manifestPromise) {
      manifestPromise = fetchImpl(manifestUrl).then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load hydrography manifest: ${response.status}`);
        const manifest = await response.json();
        assertManifest(manifest);
        return manifest;
      });
    }
    return manifestPromise;
  };

  const touch = (key, value) => {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxCachedRegions) cache.delete(cache.keys().next().value);
  };

  const loadRegion = async (regionId) => {
    const manifest = await loadManifest();
    const entry = manifest.regions.find((region) => region.id === regionId);
    if (!entry) throw new Error(`Unknown hydrography region: ${regionId}`);
    if (cache.has(regionId)) {
      const value = cache.get(regionId);
      touch(regionId, value);
      return value;
    }
    const response = await fetchImpl(entry.asset);
    if (!response.ok) throw new Error(`Failed to load hydrography region ${regionId}: ${response.status}`);
    const value = await response.json();
    touch(regionId, value);
    return value;
  };

  const loadRegions = async (regionIds) => Promise.all([...new Set(regionIds)].map(loadRegion));

  const clear = () => cache.clear();

  return { loadManifest, loadRegion, loadRegions, clear };
}
