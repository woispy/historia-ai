import fs from "node:fs";
import path from "node:path";
import { CopernicusDemSource, sampleCopernicusRaster } from "../dem/CopernicusDemSource.js";
import { encodeTerrainTile } from "../dem/TerrainAssetCodec.js";
import { makeTerrainTileKey, terrainTileBounds } from "../../../src/map/rendering/terrain/TerrainTile.js";
import { TERRAIN_LODS } from "../../../src/map/rendering/terrain/TerrainLod.js";
import { log, success } from "../shared/index.js";

const DEFAULT_BBOX = [26, 35, 46, 43];
const DEFAULT_MAX_ZOOM = 5;
const DEFAULT_GRID = 129;

/** Build real terrain assets from the public Copernicus GLO-30 COG source. */
export async function runTerrainPipeline({ bbox = parseBbox(process.env.HISTORIA_DEM_BBOX), maxZoom = integerEnv("HISTORIA_DEM_MAX_ZOOM", DEFAULT_MAX_ZOOM), grid = integerEnv("HISTORIA_DEM_GRID", DEFAULT_GRID), outputDir = path.resolve("public/assets/terrain") } = {}) {
  const extent = bbox ?? DEFAULT_BBOX;
  if (extent.length !== 4 || !(extent[0] < extent[2] && extent[1] < extent[3])) throw new Error("HISTORIA_DEM_BBOX must be minLon,minLat,maxLon,maxLat.");
  if (maxZoom < 0 || maxZoom > 5) throw new Error("HISTORIA_DEM_MAX_ZOOM must be in [0, 5].");
  if (grid < 2) throw new Error("HISTORIA_DEM_GRID must be >= 2.");
  log(`Terrain Pipeline: Copernicus GLO-30, bbox=${extent.join(",")}, maxZoom=${maxZoom}, grid=${grid}`);
  const source = await new CopernicusDemSource().initialize();
  fs.mkdirSync(outputDir, { recursive: true });
  const tiles = tilesForExtent(extent, maxZoom);
  const records = [];
  for (const tile of tiles) {
    const bounds = terrainTileBounds(tile);
    const samples = await sampleTile(source, bounds, grid);
    const encoded = encodeTerrainTile({ ...samples, bounds });
    const file = path.join(outputDir, "tiles", String(tile.level), String(tile.x), `${tile.y}.htrn`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, encoded);
    records.push({ id: tile.id, level: tile.level, x: tile.x, y: tile.y, bounds, asset: `/assets/terrain/tiles/${tile.level}/${tile.x}/${tile.y}.htrn`, grid });
  }
  const manifest = {
    version: 1,
    source: { provider: "Copernicus DEM", product: "GLO-30 Public", release: "2021 AWS public mirror", bucket: "copernicus-dem-30m" },
    coverage: { minX: extent[0], minY: extent[1], maxX: extent[2], maxY: extent[3] },
    maxZoom, lods: TERRAIN_LODS, tiles: records, generatedAt: new Date().toISOString(), format: "HTRN-v1",
  };
  fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "ATTRIBUTION.txt"), "Terrain elevation: Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.\nAdapted by Historia AI into HTRN runtime terrain assets.\n");
  success(`Terrain Pipeline generated ${records.length} HTRN tile assets.`);
  return manifest;
}

async function sampleTile(source, bounds, size) {
  const heights = new Float32Array(size * size), valid = new Uint8Array(size * size), cache = new Map();
  let min = Infinity, max = -Infinity;
  for (let y = 0; y < size; y += 1) {
    const lat = bounds.maxY - (bounds.maxY - bounds.minY) * y / (size - 1);
    for (let x = 0; x < size; x += 1) {
      const lon = bounds.minX + (bounds.maxX - bounds.minX) * x / (size - 1);
      const keyLat = Math.floor(lat === bounds.maxY ? lat - 1e-9 : lat), keyLon = Math.floor(lon === bounds.maxX ? lon - 1e-9 : lon), key = `${keyLat}/${keyLon}`;
      if (!cache.has(key)) cache.set(key, await source.readTile(keyLat, keyLon));
      const value = sampleCopernicusRaster(cache.get(key), lon, lat);
      const height = Number.isFinite(value) ? value : 0;
      heights[y * size + x] = height;
      if (Number.isFinite(value)) { valid[y * size + x] = 255; min = Math.min(min, height); max = Math.max(max, height); }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) min = max = 0;
  const range = Math.max(1, max - min), normalized = new Float32Array(heights.length);
  for (let i = 0; i < heights.length; i += 1) normalized[i] = Math.max(0, Math.min(1, (heights[i] - min) / range));
  const normals = new Int8Array(size * size * 3), splatRgba = new Uint8Array(size * size * 4), splatSnow = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, left = heights[y * size + Math.max(0, x - 1)], right = heights[y * size + Math.min(size - 1, x + 1)], down = heights[Math.max(0, y - 1) * size + x], up = heights[Math.min(size - 1, y + 1) * size + x];
    const nx = left - right, ny = down - up, nz = Math.max(1, (bounds.maxX - bounds.minX) / size * 111_000 * 2), length = Math.hypot(nx, ny, nz) || 1;
    normals[i * 3] = Math.round(nx / length * 127); normals[i * 3 + 1] = Math.round(ny / length * 127); normals[i * 3 + 2] = Math.round(nz / length * 127);
    const slope = Math.min(1, Math.hypot(nx, ny) / Math.max(1, nz)), elevation = normalized[i];
    const desert = Math.max(0, (0.42 - elevation) * 1.5) * (1 - slope * 0.35), forest = Math.max(0, 0.75 - Math.abs(elevation - 0.35) * 2.2) * (1 - slope), steppe = Math.max(0, 1 - Math.abs(elevation - 0.28) * 2.4), rock = Math.min(1, slope * 1.7 + Math.max(0, elevation - 0.72) * 2), snow = Math.max(0, (elevation - 0.84) * 5), total = Math.max(1e-6, desert + forest + steppe + rock + snow), base = i * 4;
    splatRgba[base] = Math.round(desert / total * 255); splatRgba[base + 1] = Math.round(forest / total * 255); splatRgba[base + 2] = Math.round(steppe / total * 255); splatRgba[base + 3] = Math.round(rock / total * 255); splatSnow[i] = Math.round(snow / total * 255);
  }
  return { size, heights: normalized, normals, splatRgba, splatSnow, landMask: valid };
}

function tilesForExtent(extent, maxZoom) {
  const result = [];
  for (let level = 0; level <= maxZoom; level += 1) {
    const count = 2 ** level, width = 360 / count, height = 180 / count;
    const minX = Math.max(0, Math.floor((extent[0] + 180) / width)), maxX = Math.min(count - 1, Math.floor((extent[2] - 180 - 1e-9) / width));
    const minY = Math.max(0, Math.floor((extent[1] + 90) / height)), maxY = Math.min(count - 1, Math.floor((extent[3] - 90 - 1e-9) / height));
    for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) result.push(makeTerrainTileKey(level, x, y));
  }
  return result;
}
function parseBbox(value) { if (!value) return DEFAULT_BBOX; const parts = String(value).split(",").map(Number); return parts.length === 4 && parts.every(Number.isFinite) ? parts : DEFAULT_BBOX; }
function integerEnv(name, fallback) { const value = Number.parseInt(process.env[name] ?? "", 10); return Number.isInteger(value) ? value : fallback; }
