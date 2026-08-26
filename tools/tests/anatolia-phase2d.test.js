import assert from "node:assert/strict";
import {
  buildAnatoliaPhase2DAssets,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
} from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";

const result = buildAnatoliaPhase2DAssets();

assert.equal(result.historicalDate, "1300-01-01");
assert.equal(result.provinceCount, ANATOLIA_PROVINCE_METADATA.length);
assert.equal(result.provinceCount, ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length);
assert.equal(result.provinceCount, 38, "Phase 2D must match the current authoritative 1300 province dataset");

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function signedPolygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function polygonVertexMean(polygon) {
  const sum = polygon.reduce(
    (total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function polygonAreaCentroid(polygon) {
  const signedArea = signedPolygonArea(polygon);
  if (Math.abs(signedArea) < 1e-12) return polygonVertexMean(polygon);
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const [ax, ay] = polygon[index];
    const [bx, by] = polygon[(index + 1) % polygon.length];
    const factor = ax * by - bx * ay;
    longitude += (ax + bx) * factor;
    latitude += (ay + by) * factor;
  }
  return [
    longitude / (6 * signedArea),
    latitude / (6 * signedArea),
  ];
}

const fallbackLikeProvinceIds = result.geometries
  .filter((geometry) => geometry.polygons.some((polygon) => polygonArea(polygon) < 0.00005))
  .map((geometry) => geometry.identity.provinceId);

assert.equal(
  result.fallbackProvinceCount,
  0,
  `Phase 2D must not silently replace historical province geometry with anchor fallbacks; builder reported ${result.fallbackProvinceCount}, fallback-like IDs: ${fallbackLikeProvinceIds.join(", ")}`,
);
console.log(`Phase 2D cartographic site count: ${result.siteCount}`);
assert.ok(result.siteCount >= 1000, "Phase 2D must use a dense physical/cartographic site field");
assert.equal(result.barrierSiteCount, 0, "Physical water/coast features must constrain political geometry through land clipping, not compete as political Voronoi sites");
assert.ok(
  result.politicalSiteCount >= result.provinceCount,
  "Phase 2D must retain at least one usable political control site per province",
);
assert.ok(result.polygonCount >= result.provinceCount, "Every province must contain at least one polygon");
assert.equal(result.provinces.length, result.geometries.length);

const provinceIds = new Set();
let vertexCount = 0;
for (const province of result.provinces) {
  assert.ok(!provinceIds.has(province.identity.id), `Duplicate Phase 2D province id: ${province.identity.id}`);
  provinceIds.add(province.identity.id);
  assert.equal(province.references.geometryId, province.identity.id);
  assert.equal(province.historical.classification, "phase2d-anatolia-province-geometry");
}

for (const geometry of result.geometries) {
  assert.ok(provinceIds.has(geometry.identity.provinceId));
  assert.ok(geometry.polygons.length > 0);
  for (const polygon of geometry.polygons) {
    assert.ok(polygon.length >= 3);
    vertexCount += polygon.length;

    // Use the true geometric centroid for physical-land validation. The old
    // vertex-average test produced false negatives for valid concave/coastal
    // polygons because the arithmetic mean of vertices can fall in the sea.
    const centroid = polygonAreaCentroid(polygon);
    const representative = isPhysicalLandPoint(centroid)
      ? centroid
      : polygon.find((point) => isPhysicalLandPoint(point));
    assert.ok(
      representative,
      `Phase 2D polygon must have a physical-land representative: ${geometry.identity.provinceId}`,
    );

    for (const [longitude, latitude] of polygon) {
      assert.ok(longitude >= 25 && longitude <= 46, `Longitude out of Phase 2D envelope: ${longitude}`);
      assert.ok(latitude >= 35 && latitude <= 43, `Latitude out of Phase 2D envelope: ${latitude}`);
      assert.ok(isPhysicalLandPoint([longitude, latitude]), `Phase 2D polygon vertex must remain on physical land: ${longitude},${latitude}`);
    }
  }
}

assert.ok(vertexCount >= 150, "Phase 2D geometry must contain a sufficiently detailed vertex field");

assert.equal(isAnatoliaGeometryPoint([28.9784, 41.0082]), false, "Constantinople must remain outside the Anatolia geometry override");
assert.equal(isAnatoliaGeometryPoint([26.5556, 41.6772]), false, "Adrianopolis must remain outside the Anatolia geometry override");

console.log(
  `Phase 2D Anatolia geometry tests passed: ${result.provinceCount} provinces, `
  + `${result.siteCount} political/cartographic sites, `
  + `${result.polygonCount} polygons and ${vertexCount} vertices.`,
);