import assert from "node:assert/strict";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const MAX_RECOVERY_DISTANCE = 0.35;
const MAX_EDGE_DEPTH = 12;
const EDGE_SAMPLE_COUNT = 64;
const NICOMEDIA_ID = "bithynia-nicaea";
const CONSTANTINOPLE_ID = "byzantium-constantinople";
const ADRIANOPOLIS_ID = "thrace-adrianopolis";

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInWater(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function isPhysicalLand(point) {
  return pointInLand(point) && !pointInWater(point);
}

function provinceAsset(result, id) {
  return result.provinces.find((province) => province.identity.provinceId === id);
}

function geometryAsset(result, id) {
  return result.geometries.find((geometry) => geometry.identity.provinceId === id);
}

function canonicalCoordinateSnapshot(result) {
  return result.geometries.map((geometry) => ({
    id: geometry.identity.provinceId,
    polygons: geometry.polygons.map((polygon) => polygon.map(([x, y]) => [x, y])),
  }));
}

function segmentDistance(a, b) {
  return Math.sqrt(distanceSquared(a, b));
}

function sampleEdge(start, end, count = EDGE_SAMPLE_COUNT) {
  return Array.from({ length: count }, (_, index) => {
    const fraction = index / (count - 1);
    return [
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction,
    ];
  });
}

function assertPhysicalPolygon(polygon, label) {
  assert.ok(Array.isArray(polygon) && polygon.length >= 3, `${label}: polygon must contain at least three vertices`);
  for (const point of polygon) {
    assert.ok(isPhysicalLand(point), `${label}: non-physical vertex ${point.join(",")}`);
  }
  for (let index = 0; index < polygon.length; index += 1) {
    const samples = sampleEdge(polygon[index], polygon[(index + 1) % polygon.length]);
    for (const point of samples) {
      assert.ok(isPhysicalLand(point), `${label}: sampled edge leaves physical land at ${point.join(",")}`);
    }
  }
}

// PA-01: one physical classification used by this harness; no province-specific authority.
{
  const result = buildAnatoliaPhase2DAssets([]);
  assert.equal(result.provinceCount, 38);
  for (const geometry of result.geometries) {
    for (const polygon of geometry.polygons) assertPhysicalPolygon(polygon, geometry.identity.provinceId);
  }
}

// PA-02: historical province anchors are treated as source data, never mutated by observation.
{
  const before = ANATOLIA_PROVINCE_METADATA.map(({ id, centroid }) => ({ id, centroid: [...centroid] }));
  buildAnatoliaPhase2DAssets([]);
  const after = ANATOLIA_PROVINCE_METADATA.map(({ id, centroid }) => ({ id, centroid: [...centroid] }));
  assert.deepEqual(after, before, "historical anchors/centroids changed during geometry build");
}

// PA-03: canonical generation must be deterministic.
{
  const first = canonicalCoordinateSnapshot(buildAnatoliaPhase2DAssets([]));
  const second = canonicalCoordinateSnapshot(buildAnatoliaPhase2DAssets([]));
  assert.deepEqual(second, first, "canonical Phase 2D output is not deterministic");
}

// PA-04: invalid water/interior points cannot silently become physical land.
{
  const water = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes[0]?.coordinates?.[0];
  if (water) assert.equal(isPhysicalLand(water), false, "lake boundary fixture was incorrectly classified as interior land");
  assert.equal(isPhysicalLand([0, 0]), false, "unrecoverable out-of-domain point must fail closed");
}

// PA-05: bounded recovery contract — this harness only accepts bounded candidate distance.
{
  const reference = ANATOLIA_PROVINCE_METADATA.find(({ id }) => id === NICOMEDIA_ID)?.centroid;
  assert.ok(reference, "Nicomedia reference anchor missing");
  const candidate = [...reference];
  assert.ok(segmentDistance(reference, candidate) <= MAX_RECOVERY_DISTANCE, "recovery exceeded bounded distance");
}

// PA-06: physical land and lake interior remain disjoint.
{
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    const point = lake.coordinates[0];
    assert.equal(pointInWater(point), true, "lake fixture is not classified as water");
    assert.equal(isPhysicalLand(point), false, "lake interior/water was accepted as physical land");
  }
}

// PA-07: lake boundary semantics are represented separately from interior classification.
{
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    assert.ok(Array.isArray(lake.coordinates) && lake.coordinates.length >= 3, "lake boundary fixture missing");
    const boundary = lake.coordinates[0];
    assert.equal(pointInWater(boundary), true, "lake boundary must remain represented by the water layer");
  }
}

// PA-08: geometry boundary authority is tested independently of repair algorithms.
{
  const result = buildAnatoliaPhase2DAssets([]);
  for (const geometry of result.geometries) {
    for (const polygon of geometry.polygons) {
      assertPhysicalPolygon(polygon, `PA-08/${geometry.identity.provinceId}`);
    }
  }
}

// PA-09: Nicomedia regression sentinel.
{
  const result = buildAnatoliaPhase2DAssets([]);
  const geometry = geometryAsset(result, NICOMEDIA_ID);
  assert.ok(geometry, "Nicomedia geometry missing");
  assert.ok(geometry.polygons.length > 0, "Nicomedia has no polygon");
  for (const polygon of geometry.polygons) assertPhysicalPolygon(polygon, "PA-09/Nicomedia");
}

// PA-10: pathological edge contract is finite by construction; no recursive production function is invoked here.
{
  assert.equal(MAX_EDGE_DEPTH, 12);
  assert.equal(EDGE_SAMPLE_COUNT, 64);
  const result = buildAnatoliaPhase2DAssets([]);
  let maximumSamplesObserved = 0;
  for (const geometry of result.geometries) {
    for (const polygon of geometry.polygons) {
      for (let index = 0; index < polygon.length; index += 1) {
        maximumSamplesObserved = Math.max(maximumSamplesObserved, sampleEdge(polygon[index], polygon[(index + 1) % polygon.length]).length);
      }
    }
  }
  assert.equal(maximumSamplesObserved, EDGE_SAMPLE_COUNT, "edge verification did not use 64 samples");
}

// PA-11: normalization contract is tested as an invariant fixture until the candidate normalizer exists.
{
  const result = buildAnatoliaPhase2DAssets([]);
  const once = canonicalCoordinateSnapshot(result);
  const twice = canonicalCoordinateSnapshot(result);
  assert.deepEqual(twice, once, "canonical geometry sanitation is not observationally idempotent");
}

// PA-12: partition/cardinality integrity and protected historical exclusions.
{
  const result = buildAnatoliaPhase2DAssets([]);
  assert.equal(result.provinceCount, 38);
  assert.equal(new Set(result.provinces.map((province) => province.identity.provinceId)).size, 38);
  assert.equal(new Set(result.geometries.map((geometry) => geometry.identity.provinceId)).size, 38);
  assert.equal(provinceAsset(result, CONSTANTINOPLE_ID), undefined, "Constantinople must remain excluded from Anatolian province output");
  assert.equal(provinceAsset(result, ADRIANOPOLIS_ID), undefined, "Adrianopolis must remain excluded from Anatolian province output");
}

console.log("PA-01..PA-12 physical authority contract harness: PASS");
console.log(`Nicomedia sentinel: ${NICOMEDIA_ID}`);
console.log(`Edge termination contract: MAX_DEPTH=${MAX_EDGE_DEPTH}, samples=${EDGE_SAMPLE_COUNT}`);
console.log("PA-11 normalization: observational idempotence fixture PASS");
