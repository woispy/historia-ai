import { decodeHistoricalRuntimeRegion } from "../binary/HistoricalRuntimeBinary.js";

const viteHistoricalRuntimeManifestAssets = import.meta.env
  ? import.meta.glob(
      "../assets/historical/*/manifest.json",
      { import: "default" },
    )
  : null;

const viteHistoricalRuntimeRegionAssets = import.meta.env
  ? import.meta.glob(
      "../assets/historical/*/regions/*.bin",
      { query: "?url", import: "default" },
    )
  : null;

const runtimeCache = new Map();
const manifestCache = new Map();
const nodeProcess = globalThis.process;

const nodeFs =
  nodeProcess &&
  typeof nodeProcess.getBuiltinModule === "function"
    ? nodeProcess.getBuiltinModule("fs")
    : null;

function normalizeYear(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 4);
}

function normalizeRegionIds(regionIds) {
  if (!regionIds) return null;
  return [...new Set(
    (Array.isArray(regionIds) ? regionIds : [regionIds])
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean),
  )].sort();
}

function runtimeCacheKey(year, regionIds) {
  return `${year}:${regionIds?.join(",") ?? "*"}`;
}

function mergeRuntimeRegions(year, regions) {
  const provinces = regions.flatMap((region) => region?.provinces ?? []);
  const geometries = regions.flatMap((region) => region?.geometries ?? []);
  const polygonCount = geometries.reduce(
    (total, geometry) => total + (Array.isArray(geometry?.polygons) ? geometry.polygons.length : 0),
    0,
  );

  return {
    schemaVersion: 3,
    assetType: "historical-runtime",
    historicalDate: `${year}-01-01`,
    source: regions[0]?.source ?? null,
    counts: {
      provinces: provinces.length,
      geometries: geometries.length,
      polygons: polygonCount,
    },
    provinces,
    geometries,
    loadedRegions: regions.map((region) => region.regionId).filter(Boolean),
  };
}

async function loadNodeManifest(year) {
  if (!nodeFs) return null;
  const fileUrl = new URL(`../assets/historical/${year}/manifest.json`, import.meta.url);
  if (!nodeFs.existsSync(fileUrl)) return null;
  return JSON.parse(nodeFs.readFileSync(fileUrl, "utf8"));
}

async function loadManifest(year) {
  if (manifestCache.has(year)) return manifestCache.get(year);

  if (viteHistoricalRuntimeManifestAssets) {
    const entry = Object.entries(viteHistoricalRuntimeManifestAssets).find(([path]) =>
      path.includes(`/historical/${year}/manifest.json`),
    );
    if (!entry?.[1]) return null;
    const manifest = await entry[1]();
    manifestCache.set(year, manifest);
    return manifest;
  }

  const manifest = await loadNodeManifest(year);
  if (manifest) manifestCache.set(year, manifest);
  return manifest;
}

async function loadNodeRegion(year, file, metadata) {
  if (!nodeFs) return null;
  const fileUrl = new URL(`../assets/historical/${year}/${file}`, import.meta.url);
  if (!nodeFs.existsSync(fileUrl)) return null;
  const bytes = nodeFs.readFileSync(fileUrl);
  return decodeHistoricalRuntimeRegion(bytes, metadata);
}

async function loadBrowserRegion(year, file, metadata) {
  const suffix = `/historical/${year}/${file}`;
  const entry = Object.entries(viteHistoricalRuntimeRegionAssets ?? {}).find(([path]) => path.endsWith(suffix));
  if (!entry?.[1]) return null;
  const url = await entry[1]();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Historical runtime binary request failed: ${response.status} ${file}`);
  return decodeHistoricalRuntimeRegion(new Uint8Array(await response.arrayBuffer()), metadata);
}

async function loadRegion(year, file, metadata) {
  if (viteHistoricalRuntimeRegionAssets) return loadBrowserRegion(year, file, metadata);
  return loadNodeRegion(year, file, metadata);
}

export async function loadHistoricalRuntimeAsset(date, regionIds = null) {
  const year = normalizeYear(date);
  if (!year) return null;

  const normalizedRegionIds = normalizeRegionIds(regionIds);
  const cacheKey = runtimeCacheKey(year, normalizedRegionIds);
  if (runtimeCache.has(cacheKey)) return runtimeCache.get(cacheKey);

  const manifest = await loadManifest(year);
  if (!manifest?.regions?.length) return null;

  const selectedRegions = normalizedRegionIds
    ? manifest.regions.filter((region) => normalizedRegionIds.includes(region.id))
    : manifest.regions;

  if (normalizedRegionIds && selectedRegions.length !== normalizedRegionIds.length) {
    const missing = normalizedRegionIds.filter(
      (regionId) => !selectedRegions.some((region) => region.id === regionId),
    );
    throw new Error(`Historical runtime regions are missing for ${year}: ${missing.join(", ")}`);
  }

  const loadedRegions = await Promise.all(
    selectedRegions.map((region) => loadRegion(year, region.file, {
      source: manifest.source,
      historicalDate: manifest.historicalDate,
    })),
  );
  if (loadedRegions.some((region) => !region)) {
    throw new Error(`Historical runtime region binary asset is missing for ${year}.`);
  }

  const runtime = mergeRuntimeRegions(year, loadedRegions);
  runtimeCache.set(cacheKey, runtime);
  return runtime;
}

export async function loadHistoricalRuntimeRegions(date, regionIds) {
  if (!normalizeRegionIds(regionIds)?.length) {
    throw new Error("At least one historical runtime region is required.");
  }
  return loadHistoricalRuntimeAsset(date, regionIds);
}

export async function loadHistoricalRuntimeManifest(date) {
  return loadManifest(normalizeYear(date));
}

export function clearHistoricalRuntimeCache() {
  runtimeCache.clear();
  manifestCache.clear();
}
