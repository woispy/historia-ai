import fs from "node:fs";
import path from "node:path";
import { decodeCopernicusGeoTiff, isValidDemPixel } from "./GeoTiffDecoder.js";

export const COPERNICUS_GLO30_BUCKET = "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com";
export const COPERNICUS_GLO30_TILE_LIST_URL = `${COPERNICUS_GLO30_BUCKET}/tileList.txt`;

export class CopernicusDemSource {
  constructor({ cacheDir = path.resolve(".cache/historia/copernicus-glo30"), tileListUrl = COPERNICUS_GLO30_TILE_LIST_URL } = {}) {
    this.cacheDir = cacheDir;
    this.tileListUrl = tileListUrl;
    this.tileIndex = null;
    this.loaded = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this;
    fs.mkdirSync(this.cacheDir, { recursive: true });
    const indexPath = path.join(this.cacheDir, "tileList.txt");
    let text = null;
    if (fs.existsSync(indexPath)) text = fs.readFileSync(indexPath, "utf8");
    if (text == null) {
      try {
        text = await downloadText(this.tileListUrl);
        fs.writeFileSync(indexPath, text);
      } catch (error) {
        text = "";
        if (process.env.CI) throw error;
      }
    }
    const parsed = parseTileList(text);
    this.tileIndex = parsed.length ? new Set(parsed) : null;
    this.initialized = true;
    return this;
  }

  hasTile(lat, lon) {
    const key = copernicusTileKey(lat, lon);
    return this.tileIndex ? this.tileIndex.has(key) : true;
  }

  async readTile(lat, lon) {
    if (!this.initialized) await this.initialize();
    const key = copernicusTileKey(lat, lon);
    if (this.loaded.has(key)) return this.loaded.get(key);
    if (this.tileIndex && !this.tileIndex.has(key)) return null;

    const fileName = `${key}.tif`;
    const localPath = path.join(this.cacheDir, fileName);
    let bytes;
    if (fs.existsSync(localPath)) {
      bytes = fs.readFileSync(localPath);
      console.log(`[Terrain Pipeline] DEM cache hit: ${key}`);
    } else {
      const url = `${COPERNICUS_GLO30_BUCKET}/${key}/${fileName}`;
      console.log(`[Terrain Pipeline] Downloading DEM tile: ${key}`);
      const response = await fetch(url);
      if (!response.ok) return null;
      bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) return null;
      fs.writeFileSync(localPath, bytes);
      console.log(`[Terrain Pipeline] Downloaded DEM tile: ${key} (${bytes.byteLength} bytes)`);
    }

    const raster = decodeCopernicusGeoTiff(bytes);
    const entry = { key, raster };
    this.loaded.set(key, entry);
    return entry;
  }
}

export function copernicusTileKey(lat, lon) {
  const north = Math.floor(Number(lat));
  const east = Math.floor(Number(lon));
  const ns = north >= 0 ? `N${pad2(north)}` : `S${pad2(Math.abs(north))}`;
  const ew = east >= 0 ? `E${pad3(east)}` : `W${pad3(Math.abs(east))}`;
  return `Copernicus_DSM_COG_10_${ns}_00_${ew}_00_DEM`;
}

/** Return the complete 1x1-degree Copernicus source coverage intersecting a [minLon,minLat,maxLon,maxLat] extent. */
export function copernicusSourceTileKeysForBounds(bounds) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const keys = [];
  for (let lat = Math.floor(minLat); lat < Math.ceil(maxLat); lat += 1) {
    for (let lon = Math.floor(minLon); lon < Math.ceil(maxLon); lon += 1) keys.push(copernicusTileKey(lat, lon));
  }
  return keys;
}

export function parseTileList(text) {
  const result = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/(Copernicus_DSM_COG_10_[NS]\d{2}_00_[EW]\d{3}_00_DEM)\/?(?:\s|$)/);
    if (match) result.push(match[1]);
  }
  return result;
}

/** Sample a Copernicus raster using valid-only bilinear weighting; invalid neighbors contribute zero weight. */
export function sampleCopernicusRaster(entry, lon, lat) {
  if (!entry?.raster) return null;
  const { width, height, data, nodata, georeference } = entry.raster;
  const px = (Number(lon) - georeference.originX) / georeference.scaleX;
  const py = (georeference.originY - Number(lat)) / georeference.scaleY;
  if (px < 0 || py < 0 || px > width - 1 || py > height - 1) return null;
  const x0 = Math.floor(px), y0 = Math.floor(py), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
  const fx = px - x0, fy = py - y0;
  const samples = [
    [data[y0 * width + x0], (1 - fx) * (1 - fy)],
    [data[y0 * width + x1], fx * (1 - fy)],
    [data[y1 * width + x0], (1 - fx) * fy],
    [data[y1 * width + x1], fx * fy],
  ];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [value, weight] of samples) {
    if (!isValidDemPixel(value, nodata) || weight <= 0) continue;
    weightedSum += value * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return null;
  return weightedSum / totalWeight;
}

async function downloadText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Copernicus request failed: ${response.status} ${response.statusText}`);
  return response.text();
}

function pad2(value) { return String(value).padStart(2, "0"); }
function pad3(value) { return String(value).padStart(3, "0"); }
