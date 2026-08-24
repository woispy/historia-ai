import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadHistorical1300GeoJson, importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import { buildHistoricalGeometryAsset, buildHistoricalProvinceAsset } from "../HistoricalProvinceAssetBuilder.js";
import { buildAnatoliaPhase2DAssets, isAnatoliaGeometryPoint } from "../AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputArgument = process.argv[2] ?? "--download";
const sourceDir = path.join(root, "data/gis/1300/source");
const defaultInput = path.join(sourceDir, "world_1300.geojson");
const runtimeDir = path.join(root, "src/world/map/assets/historical/1300");
const runtimePath = path.join(runtimeDir, "runtime.json");
const inputPath = inputArgument === "--download" ? defaultInput : path.resolve(process.cwd(), inputArgument);

await fs.mkdir(sourceDir, { recursive: true });
if (inputArgument === "--download") {
  const result = await downloadHistorical1300GeoJson(inputPath);
  console.log(`Downloaded ${result.featureCount} historical GIS features from ${result.url}`);
}

const regions = await importHistoricalGeoJson(inputPath, 1300);
if (!regions.length) throw new Error("The 1300 historical GIS source contains no usable polygons.");

await fs.rm(runtimeDir, { recursive: true, force: true });
await fs.mkdir(runtimeDir, { recursive: true });

const provinces = [];
const geometries = [];
const assetIds = new Set();
const sourceRegionsOutsidePhase2D = [];
const phase2DMetadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, item]));

for (const region of regions) {
  const polygon = region.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
  const representativePoint = polygon
    ? polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length)
    : null;

  if (representativePoint && isAnatoliaGeometryPoint(representativePoint)) continue;
  sourceRegionsOutsidePhase2D.push(region);
}

const phase2D = buildAnatoliaPhase2DAssets(regions);
for (const geometry of phase2D.geometries) {
  const provinceId = geometry.identity.provinceId ?? geometry.identity.id;
  const metadata = phase2DMetadataById.get(provinceId);
  if (!metadata) throw new Error(`Phase 2D geometry has no matching province metadata: ${provinceId}`);
  if (assetIds.has(provinceId)) throw new Error(`Duplicate Phase 2D province id: ${provinceId}`);

  const controllerAt1300 = metadata.historicalControl?.controllerAt1300 ?? metadata.countryId ?? null;
  const province = {
    header: {
      assetType: "province",
      assetVersion: 4,
      generator: "Historia AI Phase 2D Geometry Builder V16",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      provinceId,
      historicalAnchor: geometry.identity.historicalAnchor ?? metadata.centroid,
    },
    identity: {
      id: provinceId,
      name: metadata.name,
    },
    references: {
      geometryId: provinceId,
      countryId: metadata.countryId,
      capitalCityId: metadata.cityId,
    },
    ownership: {
      countryId: controllerAt1300,
      ownerId: controllerAt1300,
    },
    historical: {
      sourceFeatureId: provinceId,
      sourceName: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence,
      classification: "phase2d-anatolia-province-geometry",
      precision: metadata.borderConfidence,
      anchor: geometry.identity.historicalAnchor ?? metadata.centroid,
      inferenceNotice: metadata.historicalControl?.note ?? null,
    },
    administration: { governorId: null },
    population: { total: 0 },
    economy: { development: 0, wealth: 0 },
    military: { supplyLimit: 0 },
    culture: { primaryCulture: null },
    religion: { primaryReligion: null },
  };

  assetIds.add(provinceId);
  provinces.push(province);
}
for (const geometry of phase2D.geometries) {
  const provinceId = geometry.identity.provinceId ?? geometry.identity.id;
  if (assetIds.has(provinceId) === false) throw new Error(`Phase 2D geometry has no matching province asset: ${provinceId}`);
  geometries.push(geometry);
}

for (const region of sourceRegionsOutsidePhase2D) {
  const provinceAsset = buildHistoricalProvinceAsset(region);
  const geometryAsset = buildHistoricalGeometryAsset(region);
  const provinceId = provinceAsset.identity.id;
  const geometryId = geometryAsset.identity.id;

  if (assetIds.has(provinceId)) throw new Error(`Duplicate generated historical GIS asset id: ${provinceId}`);
  if (geometryId !== provinceId) throw new Error(`Province/geometry asset identity mismatch: ${provinceId} vs ${geometryId}`);

  assetIds.add(provinceId);
  provinces.push(provinceAsset);
  geometries.push(geometryAsset);
}

const polygonCount = geometries.reduce((total, geometry) => total + geometry.polygons.length, 0);
await fs.writeFile(runtimePath, `${JSON.stringify({
  schemaVersion: 3,
  assetType: "historical-runtime",
  historicalDate: "1300-01-01",
  source: {
    provider: "historical-basemaps",
    dataset: "world_1300.geojson",
    projection: "EPSG:4326",
    sourceFeatureCount: regions.length,
    regionalOverlay: {
      status: "research-only",
      id: "anatolia-byzantium-1300",
      note: "The former broad political overlay is retained as research metadata. Phase 2D replaces the coarse Anatolia source-province presentation with a deterministic 38-province cartographic geometry layer; the rest of the world remains source-derived.",
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
    polygons: polygonCount,
  },
  provinces,
  geometries,
}, null, 2)}\n`, "utf8");

console.log(`Imported ${regions.length} historical GIS features for 1300.`);
console.log(`Phase 2D generated ${phase2D.provinceCount} Anatolia provinces from ${phase2D.siteCount} cartographic sites.`);
console.log(`Phase 2D replaced ${regions.length - sourceRegionsOutsidePhase2D.length} coarse source features in the Anatolia envelope.`);
console.log(`Generated one consolidated runtime asset containing ${provinces.length} provinces and ${geometries.length} geometries.`);
console.log("Phase 2D: Anatolia uses curated cartographic province geometry; the rest of the world remains source-derived.");
console.log("Generated GIS source/assets are reproducible build artifacts and should not be committed unless redistribution is explicitly approved by the source license.");