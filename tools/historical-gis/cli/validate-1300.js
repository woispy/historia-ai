import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import regionalLayer from "../../../data/gis/1300/regional/anatolia-byzantium.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourcePath = path.join(root, "data/gis/1300/source/world_1300.geojson");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");

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
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));

assert(Array.isArray(sourceRaw.features), "Historical GIS source must contain a features array.");
assert(sourceRaw.features.length === normalizedRegions.length, `Source/normalized feature count mismatch: ${sourceRaw.features.length} vs ${normalizedRegions.length}.`);
assert(runtime.schemaVersion === 1, "Unsupported historical runtime asset schema.");
assert(runtime.assetType === "historical-runtime", "Invalid historical runtime asset type.");
assert(runtime.historicalDate === "1300-01-01", "Historical runtime date mismatch.");
assert(Array.isArray(runtime.provinces), "Runtime province array is missing.");
assert(Array.isArray(runtime.geometries), "Runtime geometry array is missing.");
const expectedRuntimeFeatureCount = normalizedRegions.length + regionalLayer.regions.length;
assert(runtime.provinces.length === expectedRuntimeFeatureCount, "Runtime province count mismatch.");
assert(runtime.geometries.length === expectedRuntimeFeatureCount, "Runtime geometry count mismatch.");
assert(runtime.source?.sourceFeatureCount === normalizedRegions.length, "Runtime source feature count mismatch.");
assert(runtime.source?.regionalOverlay?.id === regionalLayer.id, "Regional overlay metadata is missing.");
assert(runtime.source.regionalOverlay.regionCount === regionalLayer.regions.length, "Regional overlay count mismatch.");

const provinceIds = new Set();
const geometryIds = new Set();
const sourceFeatureIndices = new Set();
let polygonCount = 0;

for (const province of runtime.provinces) {
  const id = province?.identity?.id;
  assert(id, "Historical runtime contains a province without an identity.");
  assert(!provinceIds.has(id), `Duplicate runtime province id: ${id}.`);
  provinceIds.add(id);
  assert(province.references?.geometryId, `Province ${id} is missing its geometry reference.`);

  const historical = province.historical ?? {};
  assert(historical.sourceFeatureId, `Province ${id} is missing sourceFeatureId.`);
  assert(Number.isInteger(historical.sourceFeatureIndex), `Province ${id} is missing sourceFeatureIndex.`);
  const isRegional = historical.classification === "curated-regional-gameplay-overlay";
  if (!isRegional) {
    assert(historical.sourceFeatureIndex >= 0 && historical.sourceFeatureIndex < normalizedRegions.length, `Province ${id} has an invalid sourceFeatureIndex.`);
    assert(!sourceFeatureIndices.has(historical.sourceFeatureIndex), `Duplicate sourceFeatureIndex: ${historical.sourceFeatureIndex}.`);
    sourceFeatureIndices.add(historical.sourceFeatureIndex);
  } else {
    assert(historical.precision === "approximate", `Regional province ${id} must disclose approximate precision.`);
    assert(province.ownership?.countryId, `Regional province ${id} must declare an owner.`);
  }
}

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
  }
}

for (const province of runtime.provinces) {
  assert(geometryIds.has(province.references.geometryId), `Province ${province.identity.id} references missing geometry ${province.references.geometryId}.`);
}

assert(sourceFeatureIndices.size === normalizedRegions.length, "Source feature coverage mismatch.");
assert(runtime.counts?.provinces === runtime.provinces.length, "Runtime province metadata count mismatch.");
assert(runtime.counts?.geometries === runtime.geometries.length, "Runtime geometry metadata count mismatch.");
assert(runtime.counts?.polygons === polygonCount, "Runtime polygon metadata count mismatch.");

console.log(`Validated ${normalizedRegions.length} source features plus ${regionalLayer.regions.length} curated regional provinces, ${runtime.geometries.length} geometries, and ${polygonCount} polygon rings for 1300.`);
