import assert from "node:assert/strict";

import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const assets = buildAnatoliaPhase2DAssets();

assert.equal(assets.provinceCount, ANATOLIA_PROVINCE_METADATA.length, "Phase 2D province count must match metadata");
assert.equal(assets.provinceCount, 38, "Phase 2D must match the current authoritative 1300 province dataset");
assert.equal(assets.fallbackProvinceCount, 0, "Phase 2D must never silently create fallback polygons");
assert.ok(assets.naturalFeatureSiteCount > 0, "Natural-feature control sites must participate in geometry generation");

const provinceIds = new Set();

function assertPolygonIntegrity(provinceId, polygon) {
  assert.ok(polygon.length >= 3, `${provinceId}: polygon must contain at least three vertices`);

  for (const point of polygon) {
    assert.equal(isPhysicalLandPoint(point), true, `${provinceId}: polygon vertex must remain on physical land`);
  }

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];

    for (const fraction of [0.25, 0.5, 0.75]) {
      const sample = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      assert.equal(
        isPhysicalLandPoint(sample),
        true,
        `${provinceId}: polygon edge crosses physical water near ${fraction}`,
      );
    }
  }
}

for (const province of assets.provinces) {
  assert.equal(provinceIds.has(province.identity.id), false, `Duplicate province geometry: ${province.identity.id}`);
  provinceIds.add(province.identity.id);

  assert.equal(province.header.dataset, "anatolia-province-geometry-1300");
  assert.equal(province.header.generator, "Historia AI Phase 2D Geometry Builder");
  assert.equal(province.historical.classification, "phase2d-anatolia-province-geometry");

  for (const polygon of province.polygons) {
    assertPolygonIntegrity(province.identity.id, polygon);
  }
}

assert.equal(provinceIds.size, ANATOLIA_PROVINCE_METADATA.length, "Every authoritative 1300 province must have a unique geometry identity");

console.log(`Phase 2D geometry integrity passed: ${provinceIds.size} provinces, ${assets.polygonCount} polygons, ${assets.naturalFeatureSiteCount} natural-feature sites.`);
