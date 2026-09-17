/**
 * Historia AI — P9 Terrain Tile Provider
 *
 * Loads Copernicus GLO-30 DEM tiles and computes per-vertex terrain attributes.
 */

import { CopernicusDemSource } from "../../../tools/asset-builder/dem/CopernicusDemSource.js";

function hillshade(slopeDegrees, aspectDegrees) {
  const sunAzimuth = 315 * Math.PI / 180;
  const sunAltitude = 45 * Math.PI / 180;
  const slopeRad = slopeDegrees * Math.PI / 180;
  const aspectRad = aspectDegrees * Math.PI / 180;
  const cosIncidence = Math.sin(sunAltitude) * Math.cos(slopeRad) + Math.cos(sunAltitude) * Math.sin(slopeRad) * Math.cos(sunAzimuth - aspectRad);
  return Math.max(0, Math.min(1, cosIncidence));
}

function slopeAspectFromWindow(window) {
  const z0 = window[0], z1 = window[1], z2 = window[2];
  const z3 = window[3], z5 = window[5], z6 = window[6];
  const z7 = window[7], z8 = window[8];
  const anyNull = [z0, z1, z2, z3, window[4], z5, z6, z7, z8].some((v) => v == null);
  if (anyNull) return { slopeDegrees: 0, aspectDegrees: 0 };
  const dzdx = (z0 + 2 * z1 + z2 - z6 - 2 * z7 - z8) / 8;
  const dzdy = (z0 + 2 * z3 + z6 - z2 - 2 * z5 - z8) / 8;
  const slopeDegrees = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * 180 / Math.PI;
  let aspectDegrees = 0;
  if (dzdx !== 0 || dzdy !== 0) {
    aspectDegrees = Math.atan2(-dzdx, dzdy) * 180 / Math.PI;
    if (aspectDegrees < 0) aspectDegrees += 360;
  }
  return { slopeDegrees, aspectDegrees };
}

export class TerrainTile {
  constructor({ lat, lon, source }) {
    this.lat = lat; this.lon = lon; this.source = source;
    this.raster = null; this.width = 0; this.height = 0; this.nodata = null;
    this.scaleX = 0; this.scaleY = 0; this.originX = 0; this.originY = 0;
  }

  async load() {
    const entry = await this.source.readTile(this.lat, this.lon);
    if (!entry) return false;
    this.raster = entry.raster.data;
    this.width = entry.raster.width; this.height = entry.raster.height;
    this.nodata = entry.raster.nodata;
    this.scaleX = entry.raster.georeference.scaleX; this.scaleY = entry.raster.georeference.scaleY;
    this.originX = entry.raster.georeference.originX; this.originY = entry.raster.georeference.originY;
    return true;
  }

  sampleElevation(lon, lat) {
    if (!this.raster) return null;
    const px = (lon - this.originX) / this.scaleX;
    const py = (this.originY - lat) / this.scaleY;
    if (px < 0 || px > this.width - 1 || py < 0 || py > this.height - 1) return null;
    const x0 = Math.floor(px), y0 = Math.floor(py);
    const fx = px - x0, fy = py - y0;
    const x1 = Math.min(this.width - 1, x0 + 1), y1 = Math.min(this.height - 1, y0 + 1);
    const idx = (y, x) => y * this.width + x;
    const v00 = this.raster[idx(y0, x0)], v10 = this.raster[idx(y0, x1)];
    const v01 = this.raster[idx(y1, x0)], v11 = this.raster[idx(y1, x1)];
    const c00 = this.valid(v00) ? v00 : null, c10 = this.valid(v10) ? v10 : null;
    const c01 = this.valid(v01) ? v01 : null, c11 = this.valid(v11) ? v11 : null;
    if (c00 == null && c10 == null && c01 == null && c11 == null) return null;
    const c0 = c00 != null && c10 != null ? c00 + (c10 - c00) * fx : (c00 ?? c10 ?? 0);
    const c1 = c01 != null && c11 != null ? c01 + (c11 - c01) * fx : (c01 ?? c11 ?? 0);
    return c0 + (c1 - c0) * fy;
  }

  valid(value) { return value != null && value !== this.nodata; }

  computeAttributes(lon, lat) {
    const elevation = this.sampleElevation(lon, lat);
    if (elevation == null) return null;
    const window = [];
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) window.push(this.sampleElevation(lon + dx / 3600, lat + dy / 3600));
    const { slopeDegrees, aspectDegrees } = slopeAspectFromWindow(window);
    const hillshadeValue = hillshade(slopeDegrees, aspectDegrees);
    const curvature = (window[1] + window[3] + window[5] + window[7] - 4 * window[4]) / 4;
    return { elevation, slopeDegrees, aspectDegrees, hillshade: hillshadeValue, curvature };
  }
}

export class TerrainTileProvider {
  constructor({ cacheDir = ".cache/historia/copernicus-glo30" } = {}) {
    this.source = new CopernicusDemSource({ cacheDir }); this.tiles = new Map(); this.initialized = false;
  }
  async initialize(bounds) { await this.source.initialize(); this.bounds = bounds; this.initialized = true; return this; }
  async getTile(lat, lon) {
    const key = `${lat}:${lon}`;
    if (this.tiles.has(key)) return this.tiles.get(key);
    const tile = new TerrainTile({ lat, lon, source: this.source }); await tile.load(); this.tiles.set(key, tile); return tile;
  }
  computeAttributes(lon, lat) {
    const tile = this.tiles.get(`${Math.floor(lat)}:${Math.floor(lon)}`);
    return tile ? tile.computeAttributes(lon, lat) : null;
  }
}

export function biomeFromLatElevation(lat, elevation) {
  const absLat = Math.abs(lat);
  if (elevation > 4500) return 1;
  if (absLat > 66.5) return 2;
  if (absLat > 55) return elevation > 1500 ? 1 : 3;
  if (absLat > 35) return elevation > 2000 ? 1 : elevation > 1000 ? 3 : 4;
  if (absLat > 23.5) return elevation > 3000 ? 1 : elevation > 1500 ? 3 : 5;
  if (absLat > 15) return elevation > 3000 ? 1 : elevation > 2000 ? 3 : 6;
  return elevation > 3000 ? 1 : elevation > 1500 ? 3 : 8;
}

export const BIOME_PALETTE = Object.freeze([[20, 40, 80, 255], [255, 255, 255, 255], [200, 220, 230, 255], [100, 160, 100, 255], [60, 130, 60, 255], [180, 180, 80, 255], [220, 200, 100, 255], [160, 200, 60, 255], [40, 120, 40, 255], [180, 200, 140, 255], [160, 180, 160, 255]]);
export function generateBiomePalette() { return new Uint32Array(BIOME_PALETTE.map(([r, g, b, a]) => (r << 0) | (g << 8) | (b << 16) | (a << 24))); }

export async function createTerrainProvider(bounds, cacheDir) {
  const provider = new TerrainTileProvider({ cacheDir: cacheDir ?? ".cache/historia/copernicus-glo30" });
  await provider.initialize(bounds);
  const minLat = Math.floor(bounds.minLat), maxLat = Math.ceil(bounds.maxLat), minLon = Math.floor(bounds.minLon), maxLon = Math.ceil(bounds.maxLon);
  for (let lat = minLat; lat <= maxLat; lat += 1) for (let lon = minLon; lon <= maxLon; lon += 1) {
    try { await provider.getTile(lat, lon); } catch { /* ocean or unavailable tile */ }
  }
  return provider;
}
