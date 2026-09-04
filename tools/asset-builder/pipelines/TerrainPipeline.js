import fs from "node:fs";
import path from "node:path";
import { CopernicusDemSource, copernicusSourceTileKeysForBounds, sampleCopernicusRaster, sampleCopernicusRasterTrace } from "../dem/CopernicusDemSource.js";
import { decodeTerrainTile, encodeTerrainTile, sanitizeTerrainHeight } from "../../../src/map/rendering/terrain/TerrainAssetCodec.js";
import { makeTerrainTileKey, terrainTileBounds } from "../../../src/map/rendering/terrain/TerrainTile.js";
import { TERRAIN_LODS } from "../../../src/map/rendering/terrain/TerrainLod.js";
import { collectWorldLandPolygons } from "../../../src/map/physical/WorldLandMask.js";
import { log, success } from "../shared/index.js";

const DEFAULT_BBOX = [26, 35, 46, 43];
const DEFAULT_MAX_ZOOM = 5;
const DEFAULT_GRID = 129;
const GEOMETRY_ASSET_DIR = path.resolve("src/world/map/assets/geometry");
const TELEMETRY_TILE_ID = process.env.HISTORIA_TERRAIN_TELEMETRY_TILE || "1/1/1";
const HEIGHT_MIN_METERS = -500;
const HEIGHT_MAX_METERS = 9000;
const LARGE_NEIGHBOR_DELTA_METERS = 1000;

/** Build real terrain assets from Copernicus GLO-30 COG source without tile-local elevation normalization. */
export async function runTerrainPipeline({ bbox = parseBbox(process.env.HISTORIA_DEM_BBOX), maxZoom = integerEnv("HISTORIA_DEM_MAX_ZOOM", DEFAULT_MAX_ZOOM), grid = integerEnv("HISTORIA_DEM_GRID", DEFAULT_GRID), outputDir = path.resolve("public/assets/terrain") } = {}) {
  const extent = bbox ?? DEFAULT_BBOX;
  if (extent.length !== 4 || !(extent[0] < extent[2] && extent[1] < extent[3])) throw new Error("HISTORIA_DEM_BBOX must be minLon,minLat,maxLon,maxLat.");
  if (maxZoom < 0 || maxZoom > 5) throw new Error("HISTORIA_DEM_MAX_ZOOM must be in [0, 5].");
  if (grid < 2) throw new Error("HISTORIA_DEM_GRID must be >= 2.");
  log(`Terrain Pipeline: Copernicus GLO-30, bbox=${extent.join(",")}, maxZoom=${maxZoom}, grid=${grid}, elevation=meters`);
  log(`[Terrain Pipeline] telemetry target tile: ${TELEMETRY_TILE_ID}`);
  const source = await new CopernicusDemSource().initialize();
  const sourceTiles = copernicusSourceTileKeysForBounds(extent);
  log(`[Terrain Pipeline] DEM source coverage: ${sourceTiles.length} 1x1-degree tiles for bbox ${extent.join(",")}.`);
  const landPolygons = loadPhysicalLandPolygons();
  log(`[Terrain Pipeline] Physical land mask: ${landPolygons.length} polygons loaded from geometry assets.`);
  fs.mkdirSync(outputDir, { recursive: true });
  const tiles = tilesForExtent(extent, maxZoom), records = [];
  log(`[Terrain Pipeline] Planned ${tiles.length} terrain tiles across LOD 0-${maxZoom}.`);
  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    const bounds = terrainTileBoundsForCoverage(tile, extent);
    const dataBounds = terrainTileSampleBoundsForCoverage(tile, extent);
    log(`[Terrain Pipeline] Processing tile ${index + 1}/${tiles.length} (LOD ${tile.level}, x=${tile.x}, y=${tile.y})...`);
    const samples = await sampleTile(source, dataBounds, grid, extent, landPolygons);
    const encoded = encodeTerrainTile({ ...samples, bounds });
    const file = path.join(outputDir, "tiles", String(tile.level), String(tile.x), `${tile.y}.htrn`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, encoded);
    if (tile.id === TELEMETRY_TILE_ID) logTerrainTelemetry(tile, dataBounds, samples, encoded);
    records.push({ id: tile.id, level: tile.level, x: tile.x, y: tile.y, bounds, dataBounds, asset: `/assets/terrain/tiles/${tile.level}/${tile.x}/${tile.y}.htrn`, grid });
    log(`[Terrain Pipeline] Completed tile ${index + 1}/${tiles.length} (LOD ${tile.level}) -> ${path.relative(process.cwd(), file)}.`);
  }
  const manifest = { version: 3, source: { provider: "Copernicus DEM", product: "GLO-30 Public", release: "2021 AWS public mirror", bucket: "copernicus-dem-30m" }, coverage: { minX: extent[0], minY: extent[1], maxX: extent[2], maxY: extent[3] }, maxZoom, lods: TERRAIN_LODS, elevation: { unit: "meters", scaleToWorld: 0.001 }, tiles: records, generatedAt: new Date().toISOString(), format: "HTRN-v3" };
  fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "ATTRIBUTION.txt"), "Terrain elevation: Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.\nAdapted by Historia AI into HTRN runtime terrain assets.\n");
  success(`Terrain Pipeline generated ${records.length} HTRN tile assets.`);
  return manifest;
}

/** Return the canonical, untrimmed quadtree world bounds used by runtime terrain projection. */
export function terrainTileBoundsForCoverage(tile) { return terrainTileBounds(tile); }

/** Return the DEM texture sampling rectangle for a tile, clipped to configured source coverage. */
export function terrainTileSampleBoundsForCoverage(tile, coverage) {
  const bounds = terrainTileBounds(tile);
  const result = { minX: Math.max(bounds.minX, coverage[0]), minY: Math.max(bounds.minY, coverage[1]), maxX: Math.min(bounds.maxX, coverage[2]), maxY: Math.min(bounds.maxY, coverage[3]) };
  if (!(result.minX < result.maxX && result.minY < result.maxY)) throw new Error(`Terrain tile ${tile.id} does not intersect DEM coverage.`);
  return Object.freeze(result);
}

/** Return the world coordinate represented by a raster-grid vertex; Y increases south-to-north to match runtime mesh space. */
export function terrainSampleCoordinate(bounds, x, y, size) {
  if (!Number.isInteger(size) || size < 2 || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= size || y < 0 || y >= size) throw new Error("Invalid terrain sample grid coordinate.");
  return { lon: bounds.minX + (bounds.maxX - bounds.minX) * x / (size - 1), lat: bounds.minY + (bounds.maxY - bounds.minY) * y / (size - 1) };
}

async function sampleTile(source, bounds, size, coverage, landPolygons) {
  const heights = new Float32Array(size * size), demValidity = new Uint8Array(size * size), landMask = new Uint8Array(size * size), cache = new Map();
  const sampledStats = createStats();
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const { lon, lat } = terrainSampleCoordinate(bounds, x, y, size), index = y * size + x;
    if (!coordinateInCoverage(lon, lat, coverage)) { sampledStats.invalidCount += 1; continue; }
    const keyLat = Math.floor(lat === coverage[3] ? lat - 1e-9 : lat), keyLon = Math.floor(lon === coverage[2] ? lon - 1e-9 : lon), key = `${keyLat}/${keyLon}`;
    if (!cache.has(key)) cache.set(key, await source.readTile(keyLat, keyLon));
    const value = sampleCopernicusRaster(cache.get(key), lon, lat);
    updateStats(sampledStats, value, value == null || !Number.isFinite(value) || value < HEIGHT_MIN_METERS || value > HEIGHT_MAX_METERS);
    const safeValue = sanitizeTerrainHeight(value);
    if (safeValue === value) { heights[index] = safeValue; demValidity[index] = 255; }
    if (isPhysicalLand(lon, lat, landPolygons)) landMask[index] = 255;
  }
  const normals = new Int8Array(size * size * 3), splatRgba = new Uint8Array(size * size * 4), splatSnow = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, left = heights[y * size + Math.max(0, x - 1)], right = heights[y * size + Math.min(size - 1, x + 1)], down = heights[Math.max(0, y - 1) * size + x], up = heights[Math.min(size - 1, y + 1) * size + x];
    const horizontalMeters = Math.max(1, (bounds.maxX - bounds.minX) / Math.max(1, size - 1) * 111_000), nx = (left - right) / horizontalMeters, ny = (down - up) / horizontalMeters, nz = 2, length = Math.hypot(nx, ny, nz) || 1;
    normals[i*3] = Math.round(nx / length * 127); normals[i*3+1] = Math.round(ny / length * 127); normals[i*3+2] = Math.round(nz / length * 127);
    const elevation = Math.max(0, Math.min(1, heights[i] / 5000)), slope = Math.min(1, Math.hypot(nx, ny) / nz), desert = Math.max(0, (0.42-elevation)*1.5)*(1-slope*0.35), forest = Math.max(0, 0.75-Math.abs(elevation-0.35)*2.2)*(1-slope), steppe = Math.max(0, 1-Math.abs(elevation-0.28)*2.4), rock = Math.min(1, slope*1.7+Math.max(0,elevation-0.72)*2), snow = Math.max(0,(elevation-0.84)*5), total = Math.max(1e-6,desert+forest+steppe+rock+snow), base=i*4;
    splatRgba[base]=Math.round(desert/total*255); splatRgba[base+1]=Math.round(forest/total*255); splatRgba[base+2]=Math.round(steppe/total*255); splatRgba[base+3]=Math.round(rock/total*255); splatSnow[i]=Math.round(snow/total*255);
  }
  return { size, heights, normals, splatRgba, splatSnow, landMask, demValidity, sampledStats, sourceStats: [...cache.values()].filter(Boolean).map(({ key, raster }) => ({ key, ...raster.stats })), spatialDiagnostic: buildSpatialDiagnostic(cache, bounds, size, demValidity) };
}

function buildSpatialDiagnostic(cache, bounds, size, demValidity) {
  const rowDistribution = Array.from({ length:size }, (_, y) => countValidRow(demValidity, size, y));
  const columnDistribution = Array.from({ length:size }, (_, x) => countValidColumn(demValidity, size, x));
  const traceGrid = [[0,0],[Math.floor((size-1)/2),Math.floor((size-1)/2)],[size-1,size-1],[Math.floor((size-1)/2),0],[0,Math.floor((size-1)/2)],[size-1,Math.floor((size-1)/2)],[Math.floor((size-1)/2),size-1],[Math.floor((size-1)*0.2),Math.floor((size-1)*0.5)],[Math.floor((size-1)*0.7),Math.floor((size-1)*0.5)]];
  const traces = [];
  for (const [x,y] of traceGrid) {
    const { lon, lat } = terrainSampleCoordinate(bounds, x, y, size);
    const keyLat = Math.floor(lat === bounds.maxY ? lat - 1e-9 : lat), keyLon = Math.floor(lon === bounds.maxX ? lon - 1e-9 : lon), key = `${keyLat}/${keyLon}`;
    const trace = sampleCopernicusRasterTrace(cache.get(key), lon, lat);
    traces.push({ grid:[x,y], world:[lon,lat], sourceTile:key, trace });
  }
  return { validCount:demValidity.reduce((sum,value)=>sum+(value?1:0),0), invalidCount:demValidity.reduce((sum,value)=>sum+(value?0:1),0), rowDistribution, columnDistribution, traces };
}
function countValidRow(mask,size,y){let count=0;for(let x=0;x<size;x+=1)if(mask[y*size+x])count+=1;return count;}
function countValidColumn(mask,size,x){let count=0;for(let y=0;y<size;y+=1)if(mask[y*size+x])count+=1;return count;}

function logTerrainTelemetry(tile, bounds, samples, encoded) {
  const decoded = decodeTerrainTile(encoded), uploadStats = measureArrayStats(samples.heights), decodedStats = measureArrayStats(decoded.heights), encodedStats = measureEncodedHeightRange(encoded), roundTrip = measureRoundTrip(samples.heights, decoded.heights), neighborDeltaCount = countLargeNeighborDeltas(decoded.heights, decoded.size, LARGE_NEIGHBOR_DELTA_METERS), rawStats = aggregateSourceStats(samples.sourceStats);
  const telemetry = { tile: tile.id, dataBounds: bounds, rawDem: rawStats, sampledDem: normalizeStats(samples.sampledStats), validity: { validCount:samples.spatialDiagnostic.validCount, invalidCount:samples.spatialDiagnostic.invalidCount, validRatio:samples.spatialDiagnostic.validCount/(samples.spatialDiagnostic.validCount+samples.spatialDiagnostic.invalidCount) }, htrnEncoded: encodedStats, htrnDecoded: decodedStats, gpuUploadArray: uploadStats, neighborDeltaOver1000m: { count: neighborDeltaCount, thresholdMeters: LARGE_NEIGHBOR_DELTA_METERS }, htrnRoundTrip: roundTrip };
  log(`[Terrain Telemetry] ${JSON.stringify(telemetry)}`);
  log(`[Terrain Spatial] validRowDistribution=${JSON.stringify(samples.spatialDiagnostic.rowDistribution)}`);
  log(`[Terrain Spatial] validColumnDistribution=${JSON.stringify(samples.spatialDiagnostic.columnDistribution)}`);
  for (const trace of samples.spatialDiagnostic.traces) log(`[Terrain Spatial Trace] ${JSON.stringify(trace)}`);
}
function createStats() { return { min: Infinity, max: -Infinity, finiteCount: 0, invalidCount: 0 }; }
function updateStats(stats, value, invalid) { if (!Number.isFinite(value)) { stats.invalidCount += 1; return; } stats.finiteCount += 1; stats.min=Math.min(stats.min,value); stats.max=Math.max(stats.max,value); if (invalid) stats.invalidCount += 1; }
function measureArrayStats(values) { const stats=createStats(); for(const value of values) updateStats(stats,value,false); return normalizeStats(stats); }
function normalizeStats(stats) { return { min:Number.isFinite(stats.min)?stats.min:0, max:Number.isFinite(stats.max)?stats.max:0, finiteCount:stats.finiteCount, invalidCount:stats.invalidCount }; }
function measureEncodedHeightRange(encoded) { const decoded=decodeTerrainTile(encoded); return { min:decoded.bounds.minHeight, max:decoded.bounds.maxHeight, byteLength:encoded.byteLength, version:decoded.version, grid:decoded.size }; }
function aggregateSourceStats(sourceStats) { const aggregate=createStats(); for(const source of sourceStats){if(!source)continue; aggregate.min=Math.min(aggregate.min,Number(source.min)); aggregate.max=Math.max(aggregate.max,Number(source.max)); aggregate.finiteCount+=Number(source.finiteCount)||0; aggregate.invalidCount+=Number(source.invalidCount)||0;} return normalizeStats(aggregate); }
function measureRoundTrip(source, decoded) { let mismatchCount=0, maxAbsError=0; for(let i=0;i<source.length;i+=1){const a=source[i],b=decoded[i],error=Math.abs(a-b);if(error>0)mismatchCount+=1;if(error>maxAbsError)maxAbsError=error;} return { mismatchCount, maxAbsErrorMeters:maxAbsError }; }
function countLargeNeighborDeltas(values,size,threshold) { let count=0; for(let y=0;y<size;y+=1)for(let x=0;x<size;x+=1){const current=values[y*size+x];if(x+1<size&&Math.abs(current-values[y*size+x+1])>threshold)count+=1;if(y+1<size&&Math.abs(current-values[(y+1)*size+x])>threshold)count+=1;}return count; }
function loadPhysicalLandPolygons() { if (!fs.existsSync(GEOMETRY_ASSET_DIR)) return []; const modules = Object.fromEntries(fs.readdirSync(GEOMETRY_ASSET_DIR).filter((file) => /^geometry_country_.*\.json$/.test(file)).map((file) => [file, JSON.parse(fs.readFileSync(path.join(GEOMETRY_ASSET_DIR, file), "utf8"))])); return collectWorldLandPolygons(modules); }
function isPhysicalLand(lon, lat, landPolygons) { return landPolygons.some((polygon) => pointInPolygon(lon, lat, polygon)); }
function pointInPolygon(x, y, polygon) { if (!Array.isArray(polygon) || polygon.length < 3) return false; let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const xi=Number(polygon[i]?.[0]), yi=Number(polygon[i]?.[1]), xj=Number(polygon[j]?.[0]), yj=Number(polygon[j]?.[1]); const intersects=((yi>y)!=(yj>y)) && x < ((xj-xi)*(y-yi))/(yj-yi)+xi; if (intersects) inside=!inside; } return inside; }
export function coordinateInCoverage(lon, lat, coverage) { return Number(lon) >= coverage[0] && Number(lon) <= coverage[2] && Number(lat) >= coverage[1] && Number(lat) <= coverage[3]; }
function tilesForExtent(extent, maxZoom) { const result=[]; for(let level=0;level<=maxZoom;level+=1){const count=2**level,width=360/count,height=180/count,minX=Math.max(0,Math.floor((extent[0]+180)/width)),maxX=Math.min(count-1,Math.floor((extent[2]+180-1e-9)/width)),minY=Math.max(0,Math.floor((extent[1]+90)/height)),maxY=Math.min(count-1,Math.floor((extent[3]+90-1e-9)/height));for(let y=minY;y<=maxY;y+=1)for(let x=minX;x<=maxX;x+=1)result.push(makeTerrainTileKey(level,x,y));}return result; }
function parseBbox(value) { if (!value) return DEFAULT_BBOX; const parts=String(value).split(",").map(Number); return parts.length===4&&parts.every(Number.isFinite)?parts:DEFAULT_BBOX; }
function integerEnv(name,fallback){const value=Number.parseInt(process.env[name]??"",10);return Number.isInteger(value)?value:fallback;}
