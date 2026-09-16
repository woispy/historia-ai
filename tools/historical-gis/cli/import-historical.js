import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
} from "../HistoricalProvinceAssetBuilder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function requireYear() {
  const value = readArg("--year");
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("--year must be an integer between 1 and 9999.");
  }
  return year;
}

function requireInput() {
  const value = readArg("--input");
  if (!value) throw new Error("--input <geojson> is required.");
  return path.resolve(process.cwd(), value);
}

function historicalDateFor(year) {
  return `${String(year).padStart(4, "0")}-01-01`;
}

const year = requireYear();
const inputPath = requireInput();
const outputDir = path.resolve(
  root,
  readArg("--output", `src/world/map/assets/historical/${year}`),
);
const runtimePath = path.join(outputDir, "runtime.json");

const regions = await importHistoricalGeoJson(inputPath, year);
if (!regions.length) {
  throw new Error(`Historical GIS source contains no usable polygons: ${inputPath}`);
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const provinces = [];
const geometries = [];
const ids = new Set();

for (const region of regions) {
  const normalized = {
    ...region,
    year,
    historicalDate: historicalDateFor(year),
    provider: "external-evidence",
    dataset: path.basename(inputPath),
  };
  const province = buildHistoricalProvinceAsset(normalized);
  const geometry = buildHistoricalGeometryAsset(normalized);

  if (ids.has(province.identity.id)) {
    throw new Error(`Duplicate historical GIS asset id: ${province.identity.id}`);
  }
  if (geometry.identity.id !== province.identity.id) {
    throw new Error(
      `Province/geometry identity mismatch: ${province.identity.id} vs ${geometry.identity.id}`,
    );
  }

  ids.add(province.identity.id);
  provinces.push(province);
  geometries.push(geometry);
}

const polygonCount = geometries.reduce(
  (total, geometry) => total + geometry.polygons.length,
  0,
);

const runtime = {
  schemaVersion: 3,
  assetType: "historical-runtime",
  historicalDate: historicalDateFor(year),
  source: {
    provider: "external-evidence",
    dataset: path.basename(inputPath),
    projection: "EPSG:4326",
    sourceFeatureCount: regions.length,
    authorityStatus: "evidence-only",
    note: "Generic importer output is evidence/runtime material only. It is not promoted to canonical political authority without historical reconciliation and validation.",
  },
  counts: {
    provinces: provinces.length,
    geometries: geometries.length,
    polygons: polygonCount,
  },
  provinces,
  geometries,
};

await fs.writeFile(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`, "utf8");

console.log(`Imported ${regions.length} historical GIS features for ${year}.`);
console.log(`Generated ${provinces.length} provinces and ${geometries.length} geometries.`);
console.log(`Evidence-only runtime written to ${runtimePath}.`);
