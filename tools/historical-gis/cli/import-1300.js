import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadHistorical1300GeoJson, importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import { buildHistoricalGeometryAsset, buildHistoricalProvinceAsset } from "../HistoricalProvinceAssetBuilder.js";
import { buildAnatoliaPhase2DAssets, isAnatoliaGeometryPoint } from "../AnatoliaPhase2DGeometryBuilder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputArgument = process.argv[2] ?? "--download";
const sourceDir = path.join(root, "data/gis/1300/source");
const defaultInput = path.join(sourceDir, "world_1300.geojson");
const runtimeDir = path.join(root, "src/world/map/assets/historical/1300");
const regionDir = path.join(runtimeDir, "regions");
const manifestPath = path.join(runtimeDir, "manifest.json");
const inputPath = inputArgument === "--download" ? defaultInput : path.resolve(process.cwd(), inputArgument);

await fs.mkdir(sourceDir, { recursive: true });
if (inputArgument === "--download") {
  const result = await downloadHistorical1300GeoJson(inputPath);
  console.log(`Downloaded ${result.featureCount} historical GIS features from ${result.url}`);
}

const regions = await importHistoricalGeoJson(inputPath, 1300);
if (!regions.length) throw new Error("The 1300 historical GIS source contains no usable polygons.");

await fs.rm(runtimeDir, { recursive: true, force: true });
await fs.mkdir(regionDir, { recursive: true });

const provinces = [];
const geometries = [];
const assetIds = new Set();
const sourceRegionsOutsidePhase2D = [];

for (const region of regions) {
  const polygon = region.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
  const representativePoint = polygon
    ? polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length)
    : null;

  if (representativePoint && isAnatoliaGeometryPoint(representativePoint)) continue;
  sourceRegionsOutsidePhase2D.push(region);
}

const phase2D = buildAnatoliaPhase2DAssets(regions);
for (const province of phase2D.provinces) {
  if (assetIds.has(province.identity.id)) throw new Error(`Duplicate Phase 2D province id: ${province.identity.id}`);
  assetIds.add(province.identity.id);
  provinces.push({ ...province, __runtimeRegion: "anatolia" });
}
for (const geometry of phase2D.geometries) {
  if (assetIds.has(geometry.identity.id) === false) throw new Error(`Phase 2D geometry has no matching province asset: ${geometry.identity.id}`);
  geometries.push({ ...geometry, __runtimeRegion: "anatolia" });
}

for (const region of sourceRegionsOutsidePhase2D) {
  const provinceAsset = buildHistoricalProvinceAsset(region);
  const geometryAsset = buildHistoricalGeometryAsset(region);
  const provinceId = provinceAsset.identity.id;
  const geometryId = geometryAsset.identity.id;

  if (assetIds.has(provinceId)) throw new Error(`Duplicate generated historical GIS asset id: ${provinceId}`);
  if (geometryId !== provinceId) throw new Error(`Province/geometry asset identity mismatch: ${provinceId} vs ${geometryId}`);

  const runtimeRegion = classifyRuntimeRegion(region);
  assetIds.add(provinceId);
  provinces.push({ ...provinceAsset, __runtimeRegion: runtimeRegion });
  geometries.push({ ...geometryAsset, __runtimeRegion: runtimeRegion });
}

const regionIds = new Set(provinces.map((province) => province.__runtimeRegion));
const regionManifest = [];
for (const regionId of [...regionIds].sort()) {
  const regionProvinces = provinces
    .filter((province) => province.__runtimeRegion === regionId)
    .map(({ __runtimeRegion, ...province }) => province);
  const regionGeometries = geometries
    .filter((geometry) => geometry.__runtimeRegion === regionId)
    .map(({ __runtimeRegion, ...geometry }) => geometry);
  const polygonCount = regionGeometries.reduce((total, geometry) => total + geometry.polygons.length, 0);
  const file = `regions/${regionId}.json`;

  await fs.writeFile(
    path.join(runtimeDir, file),
    `${JSON.stringify({
      schemaVersion: 3,
      assetType: "historical-runtime-region",
      historicalDate: "1300-01-01",
      regionId,
      source: {
        provider: "historical-basemaps",
        dataset: "world_1300.geojson",
        projection: "EPSG:4326",
        phase2D: {
          status: "runtime",
          dataset: phase2D.dataset,
          geometryVersion: phase2D.geometryVersion,
        },
      },
      counts: {
        provinces: regionProvinces.length,
        geometries: regionGeometries.length,
        polygons: polygonCount,
      },
      provinces: regionProvinces,
      geometries: regionGeometries,
    }, null, 2)}\n`,
    "utf8",
  );

  regionManifest.push({
    id: regionId,
    file,
    provinceCount: regionProvinces.length,
    geometryCount: regionGeometries.length,
    polygonCount,
  });
}

await fs.writeFile(
  manifestPath,
  `${JSON.stringify({
    schemaVersion: 1,
    assetType: "historical-runtime-manifest",
    historicalDate: "1300-01-01",
    source: {
      provider: "historical-basemaps",
      dataset: "world_1300.geojson",
      projection: "EPSG:4326",
      sourceFeatureCount: regions.length,
      regionalOverlay: {
        status: "research-only",
        id: "anatolia-byzantium-1300",
        note: "Phase 2D replaces the coarse Anatolia source-province presentation with deterministic 38-province cartographic geometry; all remaining source-derived provinces are partitioned into stable runtime regions.",
      },
      phase2D: {
        status: "runtime",
        dataset: phase2D.dataset,
        geometryVersion: phase2D.geometryVersion,
        provinceCount: phase2D.provinceCount,
        siteCount: phase2D.siteCount,
        polygonCount: phase2D.polygonCount,
        sourceFeatureCountReplaced: regions.length - sourceRegionsOutsidePhase2D.length,
      },
    },
    counts: {
      provinces: provinces.length,
      geometries: geometries.length,
      polygons: geometries.reduce((total, geometry) => total + geometry.polygons.length, 0),
    },
    regions: regionManifest,
  }, null, 2)}\n`,
  "utf8",
);

console.log(`Imported ${regions.length} historical GIS features for 1300.`);
console.log(`Phase 2D generated ${phase2D.provinceCount} Anatolia provinces from ${phase2D.siteCount} cartographic sites.`);
console.log(`Phase 2D replaced ${regions.length - sourceRegionsOutsidePhase2D.length} coarse source features in the Anatolia envelope.`);
console.log(`Generated ${regionManifest.length} historical runtime regions containing ${provinces.length} provinces and ${geometries.length} geometries.`);
console.log(`Historical runtime manifest: ${manifestPath}`);
console.log("Phase 2D: Anatolia uses curated cartographic province geometry; the rest of the world remains source-derived.");
console.log("Generated GIS source/assets are reproducible build artifacts and should not be committed unless redistribution is explicitly approved by the source license.");

function classifyRuntimeRegion(region) {
  const polygon = region.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
  if (!polygon) return "unknown";
  const [longitude, latitude] = polygon
    .reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0])
    .map((value) => value / polygon.length);

  if (longitude < -30) return "americas";
  if (longitude >= 110 && latitude < 25) return "oceania";
  if (longitude >= 100) return "east-asia";
  if (longitude >= 80 && latitude < 35) return "south-asia";
  if (longitude >= 45 && latitude >= 35) return "central-asia";
  if (latitude < 35 && longitude >= -20 && longitude < 45) return "africa";
  if (longitude >= 35 && longitude < 55 && latitude >= 35 && latitude < 50) return "caucasus";
  if (longitude >= 25 && longitude < 45 && latitude >= 35 && latitude < 44) return "anatolia";
  if (longitude >= 10 && longitude < 30 && latitude >= 35 && latitude < 50) return "balkans";
  if (longitude >= -25 && longitude < 45 && latitude >= 35) return "europe";
  if (longitude >= 30 && longitude < 45 && latitude < 35) return "levant";
  return "west-asia";
}
