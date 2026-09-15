/**
 * Historia AI — P9 Terrain Tile Provider
 *
 * Loads Copernicus GLO-30 DEM tiles and computes per-vertex terrain
 * attributes: elevation, slope, aspect, hillshade, curvature.
 * All computations are deterministic and run at build time.
 */

import { CopernicusDemSource } from "../../../tools/asset-builder/dem/CopernicusDemSource.js";

const TILE_SIZE_DEGREES = 1;
const DEM_RESOLUTION = 3601; // Copernicus GLO-30: 1 arc-second = 3601 pixels per 1-degree tile
const SAMPLE_RADIUS_DEGREES = 1 / 3600; // 1 arc-second in degrees

/**
 * Compute hillshade from slope and aspect using the standard Lambertian model.
 * Light direction is from the northwest (azimuth=315°, altitude=45°) — standard cartographic convention.
 */
function hillshade(slopeDegrees, aspectDegrees) {
  const sunAzimuth = 315 * Math.PI / 180; // NW
  const sunAltitude = 45 * Math.PI / 180;
  const slopeRad = slopeDegrees * Math.PI / 180;
  const aspectRad = aspectDegrees * Math.PI / 180;
  const cosIncidence = Math.sin(sunAltitude) * Math.cos(slopeRad) +
    Math.cos(sunAltitude) * Math.sin(slopeRad) * Math.cos(sunAzimuth - aspectRad);
  return Math.max(0, Math.min(1, cosIncidence));
}

/**
 * Compute slope (degrees) and aspect (degrees, 0=N, 90=E, 180=S, 270=W)
 * from a 3x3 elevation window using Horn's method.
 */
function slopeAspectFromWindow(window, cellSizeDegrees) {
  // window is 3x3: [z0 z1 z2; z3 z4 z5; z6 z7 z8]
  // Horn's method: dzdx = (z0+2*z1+z2 - z6-2*z7-z8) / 8
  //                dzdy = (z0+2*z3+z6 - z2-2*z5-z8) / 8
  const z0 = window[0], z1 = window[1], z2 = window[2];
  const z3 = window[3], z4 = window[4], z5 = window[5];
  const z6 = window[6], z7 = window[7], z8 = window[8];
  const anyNull = [z0, z1, z2, z3, z4, z5, z6, z7, z8].some((v) => v == null);
  if (anyNull) return { slopeDegrees: 0, aspectDegrees: 0 };

  const dzdx = (z0 + 2 * z1 + z2 - z6 - 2 * z7 - z8) / 8;
  const dzdy = (z0 + 2 * z3 + z6 - z2 - 2 * z5 - z8) / 8;

  // Convert from degrees-per-degree to meters-per-meter
  // At equator: 1 degree ≈ 111km. At latitude lat: 1 degree lon = 111km * cos(lat)
  // For now, assume roughly equatorial scaling; aspect is independent of scale
  const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
  const slopeDegrees = slopeRad * 180 / Math.PI;

  let aspectDegrees = 0;
  if (dzdx !== 0 || dzdy !== 0) {
    aspectDegrees = Math.atan2(-dzdx, dzdy) * 180 / Math.PI;
    if (aspectDegrees < 0) aspectDegrees += 360;
  }

  return { slopeDegrees, aspectDegrees };
}

/**
 * Terrain tile cache: loads a 1-degree DEM tile and provides bilinear elevation sampling.
 */
export class TerrainTile {
  constructor({ lat, lon, source }) {
    this.lat = lat;
    this.lon = lon;
    this.source = source;
    this.raster = null;
    this.width = 0;
    this.height = 0;
    this.nodata = null;
    this.scaleX = 0;
    this.scaleY = 0;
    this.originX = 0;
    this.originY = 0;
  }

  async load() {
    const entry = await this.source.readTile(this.lat, this.lon);
    if (!entry) return false;
    this.raster = entry.raster.data;
    this.width = entry.raster.width;
    this.height = entry.raster.height;
    this.nodata = entry.raster.nodata;
    this.scaleX = entry.raster.georeference.scaleX;
    this.scaleY = entry.raster.georeference.scaleY;
    this.originX = entry.raster.georeference.originX;
    this.originY = entry.raster.georeference.originY;
    return true;
  }

  sampleElevation(lon, lat) {
    if (!this.raster) return null;
    const px = (lon - this.originX) / this.scaleX;
    const py = (this.originY - lat) / this.scaleY;
    if (px < 0 || px > this.width - 1 || py < 0 || py > this.height - 1) return null;
    const x0 = Math.floor(px), y0 = Math.floor(py);
    const x1 = Math.min(this.width - 1, x0 + 1);
    const y1 = Math.min(this.height - 1, Math.floor((this.originY - lat) / this.scaleY) + 1);
    const fx = px - x0, fy = (this.originY - lat) / this.scaleY - Math.floor((this.originY - lat) / this.scaleY);

    const idx = (y, x) => y * this.width + x;
    const v00 = this.raster[idx(Math.floor(py), x0)];
    const v10 = this.raster[idx(Math.floor(py), Math.min(this.width - 1, x0 + 1))];
    const v01 = this.raster[idx(Math.min(this.height - 1, Math.floor(py) + 1), x0)];
    const v11 = this.raster[idx(Math.min(this.height - 1, Math.floor(py) + 1), Math.min(this.width - 1, x0 + 1))];

    // Bilinear interpolation
    const c00 = this.valid(v00) ? v00 : null;
    const c10 = this.valid(v10) ? v10 : null;
    const c01 = this.valid(v01) ? v01 : null;
    const c11 = this.valid(v11) ? v11 : null;

    if (c00 == null && c10 == null && c01 == null && c11 == null) return null;
    // Simple bilinear with null handling
    const c0 = c00 != null && c10 != null ? c00 + (c10 - c00) * fx : (c00 ?? c10 ?? 0);
    const c1 = c01 != null && c11 != null ? c01 + (c11 - c01) * fx : (c01 ?? c11 ?? 0);
    return c0 + (c1 - c0) * (py - Math.floor(py));
  }

  valid(value) {
    return value != null && value !== this.nodata;
  }

  /**
   * Compute terrain attributes for a geographic point.
   * Returns { elevation, slopeDegrees, aspectDegrees, hillshade, curvature }.
   */
  computeAttributes(lon, lat) {
    const elevation = this.sampleElevation(lon, lat);
    if (elevation == null) return null;

    // Sample 3x3 window around the point
    const delta = 1 / 3600; // 1 arc-second in degrees
    const window = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        window.push(this.sampleElevation(lon + dx * 1/3600, lat + dy * 1/3600));
      }
    }
    const { slopeDegrees, aspectDegrees } = slopeAspectFromWindow(window, 1/3600);
    const hs = hillshade(slopeDegrees, aspectDegrees);
    // Simple curvature: Laplacian of elevation
    const curvature = (window[1] + window[3] + window[5] + window[7] - 4 * window[4]) / 4;

    return { elevation, slopeDegrees, aspectDegrees, hillshade, curvature };
  }
}

/**
 * Terrain tile provider: manages a cache of TerrainTile instances covering a geographic extent.
 */
export class TerrainTileProvider {
  constructor({ cacheDir = ".cache/historia/copernicus-glo30" } = {}) {
    this.source = new CopernicusDemSource({ cacheDir });
    this.tiles = new Map();
    this.initialized = false;
  }

  async initialize(bounds) {
    await this.source.initialize();
    this.bounds = bounds;
    this.initialized = true;
    return this;
  }

  async getTile(lat, lon) {
    const key = `${lat}:${lon}`;
    if (this.tiles.has(key)) return this.tiles.get(key);
    const tile = new TerrainTile({ lat, lon, source: this.source });
    await tile.load();
    this.tiles.set(key, tile);
    return tile;
  }

  /**
   * Get terrain attributes for any point within the provider's coverage.
   */
  computeAttributes(lon, lat) {
    const latTile = Math.floor(lat);
    const lonTile = Math.floor(lon);
    const tile = this.tiles.get(`${latTile}:${lonTile}`);
    if (!tile) return null;
    return tile.computeAttributes(lon, lat);
  }
}

/**
 * Simplified biome classification (Koppen-inspired) from elevation, latitude, and precipitation proxy.
 * Returns a biome ID: 0=ocean, 1=ice, 2=tundra, 3=boreal, 4=temperate, 5=mediterranean, 6=desert, 7=subtropical, 8=tropical
 */
export function biomeFromLatElevation(lat, elevation) {
  const absLat = Math.abs(lat);
  if (elevation > 4500) return 1; // ice cap
  if (absLat > 66.5) return 2; // polar/tundra
  if (absLat > 55) {
    if (elevation > 1500) return 1;
    return 3; // boreal
  }
  if (absLat > 35) {
    if (elevation > 2000) return 1;
    if (elevation > 1000) return 3;
    return 4; // temperate
  }
  if (absLat > 23.5) {
    if (elevation > 3000) return 1;
    if (elevation > 1500) return 3;
    // Simplified: Mediterranean if winter-wet (western coasts), else subtropical
    return 5; // mediterranean
  }
  if (absLat > 15) {
    if (elevation > 3000) return 1;
    if (elevation > 2000) return 3;
    return 6; // desert/subtropical
  }
  // Tropical
  if (elevation > 3000) return 1;
  if (elevation > 1500) return 3;
  return 8; // tropical
}

/**
 * Biome color palette (RGBA, 0-255).
 */
export const BIOME_PALETTE = Object.freeze([
  [20, 40, 80, 255],    // 0: ocean
  [255, 255, 255, 255], // 1: ice cap
  [200, 220, 230, 255], // 2: tundra
  [100, 160, 100, 255], // 3: boreal forest
  [60, 130, 60, 255],   // 4: temperate forest
  [180, 180, 80, 255],  // 5: mediterranean
  [220, 200, 100, 255], // 6: desert
  [160, 200, 60, 255],  // 7: subtropical
  [40, 120, 40, 255],   // 8: tropical rainforest
  [180, 200, 140, 255], // 9: montane grassland
  [160, 180, 160, 255], // 10: alpine tundra
]);

/**
 * Generate biome palette as packed RGBA8 u32 array for GPU upload.
 */
export function generateBiomePalette() {
  return new Uint32Array(BIOME_PALETTE.map(([r, g, b, a]) =>
    (r << 0) | (g << 8) | (b << 16) | (a << 24)
  ));
}

export async function createTerrainProvider(bounds, cacheDir) {
  const provider = new TerrainTileProvider({ cacheDir: cacheDir ?? ".cache/historia/copernicus-glo30" });
  await provider.initialize(bounds);
  // Pre-load tiles covering the bounds
  const minLat = Math.floor(bounds.minLat), maxLat = Math.ceil(bounds.maxLat);
  const minLon = Math.floor(bounds.minLon), maxLon = Math.ceil(bounds.maxLon);
  for (let lat = minLat; lat <= maxLat; lat += 1) {
    for (let lon = minLon; lon <= maxLon; lon += 1) {
      try {
        await provider.getTile(lat, lon);
      } catch (e) {
        // Tile may not exist (ocean); ignore
      }
    }
  }
  return provider;
}