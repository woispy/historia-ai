import assert from "node:assert/strict";
import {
  buildAnatoliaPhase2DAssets,
  isPhysicalLandPoint,
} from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const result = buildAnatoliaPhase2DAssets();

assert.equal(result.provinceCount, 38);
for (const geometry of result.geometries) {
  assert.ok(geometry.geometry.polygons.length > 0, `${geometry.identity.provinceId} has no polygons`);
  for (const polygon of geometry.geometry.polygons) {
    assert.ok(polygon.length >= 3, `${geometry.identity.provinceId} polygon is degenerate`);
    for (const point of polygon) {
      assert.ok(isPhysicalLandPoint(point), `${geometry.identity.provinceId} vertex is outside physical land: ${point.join(",")}`);
    }
  }
}

console.log(`Phase 2D physical authority invariant passed for ${result.provinceCount} provinces.`);
