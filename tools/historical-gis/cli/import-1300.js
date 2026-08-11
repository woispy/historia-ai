import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadHistorical1300GeoJson, importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import { buildHistoricalGeometryAsset, buildHistoricalProvinceAsset } from "../HistoricalProvinceAssetBuilder.js";

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

for (const region of regions) {
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
  schemaVersion: 2,
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
      note: "The former broad political overlay is retained as research metadata but is no longer imported as runtime province geometry. Phase 2C refinement metadata is resolved separately by stable Phase 2B province ids.",
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
console.log(`Generated one consolidated runtime asset containing ${provinces.length} provinces and ${geometries.length} geometries.`);
console.log("Phase 2C: broad curated political overlay is research-only; runtime geometry remains source-derived.");
console.log("Generated GIS source/assets are reproducible build artifacts and should not be committed unless redistribution is explicitly approved by the source license.");
