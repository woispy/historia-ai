import fs from "node:fs";
import path from "node:path";
import { decodeCopernicusGeoTiff } from "./GeoTiffDecoder.js";

export const COPERNICUS_GLO30_BUCKET = "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com";
export const COPERNICUS_GLO30_TILE_LIST_URL = `${COPERNICUS_GLO30_BUCKET}/tileList.txt`;

export class CopernicusDemSource {
  constructor({ cacheDir = path.resolve(".cache/historia/copernicus-glo30"), tileListUrl = COPERNICUS_GLO30_TILE_LIST_URL } = {}) {
    this.cacheDir = cacheDir;
    this.tileListUrl = tileListUrl;
    this.tileIndex = null;
    this.loaded = new Map();
  }

  async initialize() {
    fs.mkdirSync(this.cacheDir, { recursive: true });
    const indexPath = path.join(this.cacheDir, "tileList.txt");
    let text = null;
    if (fs.existsSync(indexPath)) text = fs.readFileSync(indexPath, "utf8");
    if (text == null) {
      try {
        text = await downloadText(this.tileListUrl);
        fs.writeFileSync(indexPath, text);
      } catch (error) {
        // The source remains usable without the optional public tile index.
        text = "";
        if (process.env.CI) throw error;
      }
    }
    const parsed = parseTileList(text);
    this.tileIndex = parsed.length ? new Set(parsed) : null;
    return this;
  }

  hasTile(lat, lon) {
    const key = copernicusTileKey(lat, lon);
    return this.tileIndex ? this.tileIndex.has(key) : true;
  }

  async readTile(lat, lon) {
    if (!this.tileIndex && this.tileIndex !== null) await this.initialize();
    const key = copernicusTileKey(lat, lon);
    if (this.loaded.has(key)) return this.loaded.get(key);
    if (this.tileIndex && !this.tileIndex.has(key)) return null;

    const fileName = `${key}.tif`;
    const localPath = path.join(this.cacheDir, fileName);
    let bytes;
    if (fs.existsSync(localPath)) {
      bytes = fs.readFileSync(localPath);
    } else {
      const url = `${COPERNICUS_GLO30_BUCKET}/${key}/${fileName}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) return null;
      fs.writeFileSync(localPath, bytes);
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

export function parseTileList(text) {
  const result = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/(Copernicus_DSM_COG_10_[NS]\d{2}_00_[EW]\d{3}_00_DEM)\/?(?:\s|$)/);
    if (match) result.push(match[1]);
  }
  return result;
}

export function sampleCopernicusRaster(entry, lon, lat) {
  if (!entry?.raster) return null;
  const { width, height, data, nodata, georeference } = entry.raster;
  const px = (Number(lon) - georeference.originX) / georeference.scaleX;
  const py = (georeference.originY - Number(lat)) / georeference.scaleY;
  if (px < 0 || py < 0 || px > width - 1 || py > height - 1) return null;
  const x0 = Math.floor(px), y0 = Math.floor(py), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
  const fx = px - x0, fy = py - y0;
  const values = [data[y0 * width + x0], data[y0 * width + x1], data[y1 * width + x0], data[y1 * width + x1]];
  const valid = values.filter((value) => Number.isFinite(value) && (nodata === null || Math.abs(value - nodata) > 1e-6));
  if (!valid.length) return null;
  const fallback = valid[0];
  const a = validValue(values[0], fallback, nodata), b = validValue(values[1], fallback, nodata);
  const c = validValue(values[2], fallback, nodata), d = validValue(values[3], fallback, nodata);
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

function validValue(value, fallback, nodata) {
  return Number.isFinite(value) && (nodata === null || Math.abs(value - nodata) > 1e-6) ? value : fallback;
}

async function downloadText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Copernicus request failed: ${response.status} ${response.statusText}`);
  return response.text();
}

function pad2(value) { return String(value).padStart(2, "0"); }
function pad3(value) { return String(value).padStart(3, "0"); }
