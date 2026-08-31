import assert from "node:assert/strict";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DRecovery.js";
import { isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const result = buildAnatoliaPhase2DAssets([]);
assert.equal(result.provinceCount, 38);
assert.equal(result.provinces.length, 38);
assert.equal(result.geometries.length, 38);
assert.ok(result.polygonCount >= 38);
assert.ok(result.provinces.every((province) => province.polygons.length > 0));
assert.ok(result.geometries.every((geometry) => geometry.polygons.length > 0));
for (const geometry of result.geometries) {
  for (const polygon of geometry.polygons) {
    assert.ok(polygon.length >= 3);
    assert.ok(polygon.every((point) => isPhysicalLandPoint(point)), `${geometry.identity.id} contains non-land geometry`);
  }
}

console.log(`Phase 2D recovery contract passed: ${result.provinceCount} provinces, ${result.polygonCount} polygons, ${result.fallbackProvinceCount} fallback provinces.`);
