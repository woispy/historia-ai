import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";

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

const rootData = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  importHistoricalGeoJson(sourcePath, 1300),
  fs.readFile(runtimePath, "utf8"),
]);
const sourceRaw = JSON.parse(rootData[0]);
const normalizedRegions = rootData[1];
const runtime = JSON.parse(rootData[2]);

assert(Array.isArray(sourceRaw.features), "Historical GIS source must contain a features array.");
assert(sourceRaw.features.length === normalizedRegions.length, `Source/normalized feature count mismatch: ${sourceRaw.features.length} vs ${normalizedRegions.length}.`);
assert(runtime.schemaVersion === 3, "Unsupported historical runtime asset schema.");
assert(runtime.assetType === "historical-runtime", "Invalid historical runtime asset type.");
assert(runtime.historicalDate === "1300-01-01", "Historical runtime date mismatch.");
assert(Array.isArray(runtime.provinces), "Runtime province array is missing.");
assert(Array.isArray(runtime.geometries), "Runtime geometry array is missing.");
assert(runtime.source?.sourceFeatureCount === normalizedRegions.length, "Runtime source feature count mismatch.");
assert(runtime.source?.regionalOverlay?.status === "research-only", "Runtime regional overlay policy must be research-only.");
assert(runtime.source?.phase2D?.status === "runtime", "Phase 2D runtime geometry is missing.");
assert(runtime.source?.phase2D?.provinceCount === 44, "Phase 2D must provide exactly 44 Anatolia provinces.");

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

// Phase 2D deliberately uses a bounded cartographic control field rather than
// an oversized uniform point grid. The stable contract is enough local control
// sites per province to preserve historical anchors, adjacency and natural /
// coastline constraints without turning the Voronoi stage into an O(n²) point explosion.
assert(polygonCount >= Math.ceil(phase2DProvinceCount * 1.0), "Phase 2D geometry layer is unexpectedly coarse.");
assert(vertexCount >= 350, "Phase 2D geometry vertex field is unexpectedly sparse.");
assert(runtime.source.phase2D.siteCount >= phase2DProvinceCount * 40, "Phase 2D cartographic site field is unexpectedly sparse.");

console.log(`Validated 1300 runtime: ${sourceDerivedCount} source-derived provinces + ${phase2DCount} Phase 2D Anatolia provinces, ${polygonCount} polygon rings, ${vertexCount} vertices.`);
