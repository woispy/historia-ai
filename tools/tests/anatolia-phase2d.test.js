import assert from "node:assert/strict";
import {
  buildAnatoliaPhase2DAssets,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
} from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const result = buildAnatoliaPhase2DAssets([
  { polygons: [[[29.9, 40.7], [30.1, 40.7], [30.1, 40.9], [29.9, 40.7]]] },
  { polygons: [[[27.4, 38.4], [27.7, 38.4], [27.7, 38.7], [27.4, 38.4]]] },
]);

assert.equal(result.historicalDate, "1300-01-01");
assert.equal(result.provinceCount, ANATOLIA_PROVINCE_METADATA.length);
assert.equal(result.provinceCount, 38);
console.log(`Phase 2D cartographic site count: ${result.siteCount}`);
assert.ok(result.siteCount >= 1000, "Phase 2D must use a dense physical/cartographic site field");
assert.ok(result.barrierSiteCount >= 300, "Phase 2D must include a substantial physical water/coast barrier field");
assert.ok(
  result.politicalSiteCount >= result.provinceCount,
  "Phase 2D must retain at least one usable political control site per province",
);
assert.ok(result.polygonCount >= result.provinceCount, "Every province must contain at least one polygon");
assert.ok(result.polygonCount >= 500, "Phase 2D must produce substantially more geometry fragments than the coarse 38-anchor layer");
assert.equal(result.provinces.length, result.geometries.length);

const provinceIds = new Set();
for (const province of result.provinces) {
  assert.ok(!provinceIds.has(province.identity.id), `Duplicate Phase 2D province id: ${province.identity.id}`);
  provinceIds.add(province.identity.id);
  assert.equal(province.references.geometryId, province.identity.id);
  assert.equal(province.historical.classification, "phase2d-anatolia-province-geometry");
}

function polygonCentroid(polygon) {
  const sum = polygon.reduce(
    (total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

for (const geometry of result.geometries) {
  assert.ok(provinceIds.has(geometry.identity.provinceId));
  assert.ok(geometry.polygons.length > 0);
  for (const polygon of geometry.polygons) {
    assert.ok(polygon.length >= 3);
    const centroid = polygonCentroid(polygon);
    assert.ok(
      isPhysicalLandPoint(centroid),
      `Phase 2D polygon centroid must remain on physical land: ${centroid.join(",")}`,
    );
    for (const [longitude, latitude] of polygon) {
      assert.ok(longitude >= 25 && longitude <= 46, `Longitude out of Phase 2D envelope: ${longitude}`);
      assert.ok(latitude >= 35 && latitude <= 43, `Latitude out of Phase 2D envelope: ${latitude}`);
    }
  }
}

assert.equal(isAnatoliaGeometryPoint([28.9784, 41.0082]), false, "Constantinople must remain outside the Anatolia geometry override");
assert.equal(isAnatoliaGeometryPoint([26.5556, 41.6772]), false, "Adrianopolis must remain outside the Anatolia geometry override");
assert.equal(isAnatoliaGeometryPoint([35.155, 42.0231]), true, "Sinop must remain inside the Anatolia geometry override");
assert.equal(isAnatoliaGeometryPoint([29.9169, 40.7654]), true, "Nicomedia must remain inside the Anatolia geometry override");
assert.equal(isAnatoliaGeometryPoint([27.43, 37.03]), true, "Halikarnassos must remain inside the Anatolia geometry override");

console.log(
  `Phase 2D Anatolia geometry tests passed: ${result.provinceCount} provinces, `
  + `${result.siteCount} sites (${result.barrierSiteCount} physical barriers), `
  + `${result.polygonCount} cartographic polygons.`,
);
