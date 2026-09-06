import { CopernicusDemSource, copernicusSourceTileKeysForBounds, copernicusTileKey, sampleCopernicusRaster } from "../../asset-builder/dem/CopernicusDemSource.js";
import { adaptDemSample } from "./CostAdapters.js";

const DEFAULT_CACHE_DIR = ".cache/historia/copernicus-glo30";
const DEFAULT_SLOPE_SAMPLE_DEGREES = 0.01;
const DEFAULT_RIDGE_PROMINENCE_METERS = 120;
const DEFAULT_MOUNTAIN_ELEVATION_METERS = 1800;
const DEFAULT_MOUNTAIN_SLOPE_DEGREES = 28;

function finite(value, name) { const number = Number(value); if (!Number.isFinite(number)) throw new Error(`${name} must be finite`); return number; }
function clamp01(value) { return Math.min(1, Math.max(0, Number(value))); }

export class CopernicusDemCostSampler {
  constructor({ bounds, source = new CopernicusDemSource({ cacheDir: DEFAULT_CACHE_DIR }), slopeSampleDegrees = DEFAULT_SLOPE_SAMPLE_DEGREES, ridgeProminenceMeters = DEFAULT_RIDGE_PROMINENCE_METERS, mountainElevationMeters = DEFAULT_MOUNTAIN_ELEVATION_METERS, mountainSlopeDegrees = DEFAULT_MOUNTAIN_SLOPE_DEGREES } = {}) {
    if (!bounds || !(bounds.minLon < bounds.maxLon) || !(bounds.minLat < bounds.maxLat)) throw new Error("bounds must define a positive geographic extent");
    this.bounds = Object.freeze({ ...bounds }); this.source = source;
    this.slopeSampleDegrees = finite(slopeSampleDegrees, "slopeSampleDegrees");
    this.ridgeProminenceMeters = finite(ridgeProminenceMeters, "ridgeProminenceMeters");
    this.mountainElevationMeters = finite(mountainElevationMeters, "mountainElevationMeters");
    this.mountainSlopeDegrees = finite(mountainSlopeDegrees, "mountainSlopeDegrees");
    if ([this.slopeSampleDegrees, this.ridgeProminenceMeters, this.mountainElevationMeters, this.mountainSlopeDegrees].some((value) => value <= 0)) throw new Error("DEM sampler thresholds must be > 0");
    this.entries = new Map(); this.sampleCache = new Map(); this.elevationCache = new Map();
  }

  async initialize() {
    await this.source.initialize();
    const keys = copernicusSourceTileKeysForBounds([this.bounds.minLon, this.bounds.minLat, this.bounds.maxLon, this.bounds.maxLat]);
    for (const key of keys) {
      const match = key.match(/_10_([NS])(\d{2})_00_([EW])(\d{3})_00_DEM$/);
      if (!match) throw new Error(`Invalid Copernicus tile key: ${key}`);
      const lat = Number(match[2]) * (match[1] === "N" ? 1 : -1) + 0.5;
      const lon = Number(match[4]) * (match[3] === "E" ? 1 : -1) + 0.5;
      const entry = await this.source.readTile(lat, lon); if (entry) this.entries.set(key, entry);
    }
    if (!this.entries.size) throw new Error("Copernicus DEM sampler loaded no source tiles for graph bounds");
    return this;
  }

  sample(node) {
    const lon = finite(node?.lon, "node.lon"); const lat = finite(node?.lat, "node.lat"); const cacheKey = node?.id ?? `${lon}:${lat}`;
    if (this.sampleCache.has(cacheKey)) return this.sampleCache.get(cacheKey);
    const center = this.elevation(lon, lat); if (center == null) return this.#cache(cacheKey, nullCostSample());
    const delta = this.slopeSampleDegrees;
    const west = this.elevation(lon - delta, lat), east = this.elevation(lon + delta, lat), south = this.elevation(lon, lat - delta), north = this.elevation(lon, lat + delta);
    const neighbours = [west, east, south, north].filter((value) => value != null); if (neighbours.length < 2) return this.#cache(cacheKey, nullCostSample());
    const metresLon = Math.max(1, delta * 111000 * Math.cos(lat * Math.PI / 180)), metresLat = Math.max(1, delta * 111000);
    const dzdx = west != null && east != null ? (east - west) / (2 * metresLon) : 0, dzdy = south != null && north != null ? (north - south) / (2 * metresLat) : 0;
    const slopeDegrees = Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI;
    const meanNeighbour = neighbours.reduce((sum, value) => sum + value, 0) / neighbours.length;
    const ridgeAffinity = clamp01((center - meanNeighbour) / this.ridgeProminenceMeters);
    const mountainResistance = clamp01(Math.max(Math.max(0, center) / this.mountainElevationMeters, slopeDegrees / this.mountainSlopeDegrees));
    return this.#cache(cacheKey, adaptDemSample({ slopeDegrees, ridgeAffinity, mountainResistance }));
  }

  elevation(lonOrNode, maybeLat) {
    const lon = finite(typeof lonOrNode === "object" ? lonOrNode?.lon : lonOrNode, "lon");
    const lat = finite(typeof lonOrNode === "object" ? lonOrNode?.lat : maybeLat, "lat");
    const cacheKey = `${lon}:${lat}`;
    if (this.elevationCache.has(cacheKey)) return this.elevationCache.get(cacheKey);
    const value = this.#elevation(lon, lat);
    this.elevationCache.set(cacheKey, value);
    return value;
  }

  #cache(key, value) { this.sampleCache.set(key, value); return value; }
  #elevation(lon, lat) { if (lon < this.bounds.minLon - 1 || lon > this.bounds.maxLon + 1 || lat < this.bounds.minLat - 1 || lat > this.bounds.maxLat + 1) return null; const entry = this.entries.get(copernicusTileKey(lat, lon)); return entry ? sampleCopernicusRaster(entry, lon, lat) : null; }
}

export const copernicusDemSamplerDefaults = Object.freeze({ slopeSampleDegrees: DEFAULT_SLOPE_SAMPLE_DEGREES, ridgeProminenceMeters: DEFAULT_RIDGE_PROMINENCE_METERS, mountainElevationMeters: DEFAULT_MOUNTAIN_ELEVATION_METERS, mountainSlopeDegrees: DEFAULT_MOUNTAIN_SLOPE_DEGREES });

function nullCostSample() { return { slope: 1, ridge: 1, mountain: 1, river: 0, lake: 0, coast: 0 }; }
