import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";
import { decodeHistoricalRuntimeRegion } from "../../../src/world/map/binary/HistoricalRuntimeBinary.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourcePath = path.join(root, "data/gis/1300/source/world_1300.geojson");
const runtimeDir = path.join(root, "src/world/map/assets/historical/1300");
const manifestPath = path.join(runtimeDir, "manifest.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validatePolygonRing(polygon, label) {
  assert(Array.isArray(polygon) && polygon.length >= 3, `${label} has an invalid polygon ring.`);
  for (const coordinate of polygon) {
    assert(Array.isArray(coordinate) && coordinate.length >= 2, `${label} contains an invalid coordinate.`);
    const [longitude, latitude] = coordinate;
    assert(Number.isFinite(longitude) && Number.isFinite(latitude), `${label} contains a non-numeric coordinate.`);
    assert(longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90, `${label} contains an out-of-range coordinate.`);
  }
}

const sourceRaw = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const normalizedRegions = await importHistoricalGeoJson(sourcePath, 1300);
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const curatedAnatoliaProvinceCount = ANATOLIA_PROVINCE_METADATA.length;

assert(Array.isArray(sourceRaw.features), "Historical GIS source must contain a features array.");
assert(sourceRaw.features.length === normalizedRegions.length, `Source/normalized feature count mismatch: ${sourceRaw.features.length} vs ${normalizedRegions.length}.`);
assert(manifest.schemaVersion === 2, "Unsupported historical runtime manifest schema.");
assert(manifest.assetType === "historical-runtime-manifest", "Invalid historical runtime manifest type.");
assert(manifest.historicalDate === "1300-01-01", "Historical runtime manifest date mismatch.");
assert(manifest.dataPlane?.format === "hmap", "Historical runtime must use the HMAP binary data plane.");
assert(manifest.dataPlane?.version === 1, "Unsupported historical binary data-plane version.");
assert(manifest.dataPlane?.geometryPrecision === "float64", "Historical binary geometry precision contract changed.");
assert(Array.isArray(manifest.regions) && manifest.regions.length >= 2, "Historical runtime must contain multiple regions.");
assert(manifest.source?.sourceFeatureCount === normalizedRegions.length, "Runtime source feature count mismatch.");
assert(manifest.source?.regionalOverlay?.status === "research-only", "Runtime regional overlay policy must be research-only.");
assert(manifest.source?.phase2D?.status === "runtime", "Phase 2D runtime geometry is missing.");
assert(manifest.source?.phase2D?.provinceCount === curatedAnatoliaProvinceCount, `Phase 2D province count must match curated Anatolia metadata (${curatedAnatoliaProvinceCount}).`);
assert(curatedAnatoliaProvinceCount >= 40, "Curated Anatolia mesh must remain materially finer than the original 38-province pass.");

const regionAssets = [];
for (const region of manifest.regions) {
  assert(/^regions\/[a-z0-9-]+\.bin$/.test(region.file), `Historical runtime region must be binary: ${region.id}.`);
  const bytes = new Uint8Array(await fs.readFile(path.join(runtimeDir, region.file)));
  assert(bytes.byteLength === region.byteLength, `Binary byte length mismatch: ${region.id}.`);
  const asset = decodeHistoricalRuntimeRegion(bytes, { source: manifest.source });
  assert(asset.assetType === "historical-runtime-region", `Invalid historical runtime region asset: ${region.id}.`);
  assert(asset.regionId === region.id, `Region identity mismatch: ${region.id}.`);
  assert(asset.historicalDate === manifest.historicalDate, `Region date mismatch: ${region.id}.`);
  assert(asset.counts?.provinces === asset.provinces.length, `Region province count mismatch: ${region.id}.`);
  assert(asset.counts?.geometries === asset.geometries.length, `Region geometry count mismatch: ${region.id}.`);
  assert(asset.counts?.polygons === region.polygonCount, `Region polygon count mismatch: ${region.id}.`);
  regionAssets.push(asset);
}

const runtime = {
  schemaVersion: 3,
  assetType: "historical-runtime",
  historicalDate: manifest.historicalDate,
  source: manifest.source,
  counts: manifest.counts,
  provinces: regionAssets.flatMap((asset) => asset.provinces),
  geometries: regionAssets.flatMap((asset) => asset.geometries),
};

assert(runtime.provinces.length === manifest.counts.provinces, "Manifest province count mismatch.");
assert(runtime.geometries.length === manifest.counts.geometries, "Manifest geometry count mismatch.");

const phase2DProvinceCount = runtime.source.phase2D.provinceCount;
const replacedSourceFeatureCount = runtime.source.phase2D.sourceFeatureCountReplaced;
const expectedSourceDerivedCount = normalizedRegions.length - replacedSourceFeatureCount;
assert(runtime.provinces.length === expectedSourceDerivedCount + phase2DProvinceCount, "Runtime province count does not match Phase 2D replacement accounting.");
assert(runtime.geometries.length === runtime.provinces.length, "Runtime province/geometry count mismatch.");

const provinceIds = new Set();
const geometryIds = new Set();
const sourceFeatureIndices = new Set();
let phase2DCount = 0;
let sourceDerivedCount = 0;
let polygonCount = 0;
let vertexCount = 0;

for (const province of runtime.provinces) {
  const id = province?.identity?.id;
  assert(id, "Historical runtime contains a province without an identity.");
  assert(!provinceIds.has(id), `Duplicate runtime province id: ${id}.`);
  provinceIds.add(id);
  assert(province.references?.geometryId, `Province ${id} is missing its geometry reference.`);

  const historical = province.historical ?? {};
  if (historical.classification === "phase2d-anatolia-province-geometry") {
    phase2DCount += 1;
    assert(!Number.isInteger(historical.sourceFeatureIndex), `Phase 2D province ${id} must not pretend to be a source feature.`);
    assert(historical.sourceFeatureId === id, `Phase 2D province ${id} must use its stable identity as sourceFeatureId.`);
  } else {
    sourceDerivedCount += 1;
    assert(historical.sourceFeatureId, `Province ${id} is missing sourceFeatureId.`);
    assert(Number.isInteger(historical.sourceFeatureIndex), `Province ${id} is missing sourceFeatureIndex.`);
    assert(historical.sourceFeatureIndex >= 0 && historical.sourceFeatureIndex < normalizedRegions.length, `Province ${id} has an invalid sourceFeatureIndex.`);
    assert(!sourceFeatureIndices.has(historical.sourceFeatureIndex), `Duplicate sourceFeatureIndex: ${historical.sourceFeatureIndex}.`);
    sourceFeatureIndices.add(historical.sourceFeatureIndex);
  }
}

assert(phase2DCount === phase2DProvinceCount, `Expected ${phase2DProvinceCount} Phase 2D provinces, found ${phase2DCount}.`);
assert(sourceDerivedCount === expectedSourceDerivedCount, "Source-derived province coverage mismatch.");
assert(sourceFeatureIndices.size === expectedSourceDerivedCount, "Source feature coverage mismatch after Phase 2D replacement.");
assert(replacedSourceFeatureCount + sourceDerivedCount === normalizedRegions.length, "Phase 2D source replacement accounting is inconsistent.");

for (const geometry of runtime.geometries) {
  const identity = geometry?.identity ?? {};
  const id = identity.id;
  assert(id, "Historical runtime contains geometry without an identity.");
  assert(!geometryIds.has(id), `Duplicate runtime geometry id: ${id}.`);
  geometryIds.add(id);
  assert(identity.provinceId === id, `Geometry/province identity mismatch: ${id}.`);
  assert(provinceIds.has(id), `Geometry references missing province: ${id}.`);
  assert(Array.isArray(geometry.polygons) && geometry.polygons.length > 0, `Geometry ${id} has no polygons.`);
  for (const polygon of geometry.polygons) {
    validatePolygonRing(polygon, `Geometry ${id}`);
    polygonCount += 1;
    vertexCount += polygon.length;
  }
}

for (const province of runtime.provinces) {
  assert(geometryIds.has(province.references.geometryId), `Province ${province.identity.id} references missing geometry ${province.references.geometryId}.`);
}

assert(runtime.counts?.provinces === runtime.provinces.length, "Runtime province metadata count mismatch.");
assert(runtime.counts?.geometries === runtime.geometries.length, "Runtime geometry metadata count mismatch.");
assert(runtime.counts?.polygons === polygonCount, "Runtime polygon metadata count mismatch.");
assert(polygonCount >= Math.ceil(phase2DProvinceCount * 1.5), "Phase 2D geometry layer is unexpectedly coarse.");
assert(vertexCount >= 350, "Phase 2D geometry vertex field is unexpectedly sparse.");
assert(runtime.source.phase2D.siteCount >= 3000, "Phase 2D cartographic site field is unexpectedly sparse.");

console.log(`Validated 1300 binary regional runtime: ${manifest.regions.length} regions, ${sourceDerivedCount} source-derived provinces + ${phase2DCount} Phase 2D Anatolia provinces, ${polygonCount} polygon rings, ${vertexCount} vertices.`);
