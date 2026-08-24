import assert from "node:assert/strict";

import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";

const assets = buildAnatoliaPhase2DAssets();
assert.equal(assets.provinceCount, ANATOLIA_PROVINCE_METADATA.length, "Phase 2D province count must match metadata");
assert.equal(assets.provinceCount, 38, "Phase 2D must match the current authoritative 1300 province dataset");

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const current = polygon[index];
    const before = polygon[previous];
    if (
      (current[1] > point[1]) !== (before[1] > point[1])
      && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || 1e-12) + current[0]
    ) inside = !inside;
  }
  return inside;
}

function isAtlasLandPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))
    && !ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

const fallbackLikeProvinceIds = assets.geometries
  .filter((geometry) => geometry.polygons.some((polygon) => polygonArea(polygon) < 0.00005))
  .map((geometry) => geometry.identity.provinceId);

assert.equal(assets.fallbackProvinceCount, 0, `Phase 2D must not silently create fallback polygons: ${fallbackLikeProvinceIds.join(", ")}`);
assert.equal(fallbackLikeProvinceIds.length, 0, `Phase 2D contains fallback-sized province geometry: ${fallbackLikeProvinceIds.join(", ")}`);
assert.ok(assets.naturalFeatureSiteCount > 0, "Natural-feature control sites must participate in geometry generation");
assert.ok(assets.politicalSiteCount >= 38, "Phase 2D must retain at least one political control site per province");

const provinceIds = new Set();
const allPolygons = [];
const provinceAreas = [];

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
      assert.equal(isPhysicalLandPoint(sample), true, `${provinceId}: polygon edge crosses physical water near ${fraction}`);
    }
  }
}

for (const province of assets.provinces) {
  assert.equal(provinceIds.has(province.identity.id), false, `Duplicate province geometry: ${province.identity.id}`);
  provinceIds.add(province.identity.id);
  assert.equal(province.header.dataset, "anatolia-province-geometry-1300");
  assert.equal(province.header.generator, "Historia AI Phase 2D Geometry Builder");
  assert.equal(province.historical.classification, "phase2d-anatolia-province-geometry");

  const totalArea = province.polygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0);
  provinceAreas.push({ id: province.identity.id, area: totalArea });
  for (const polygon of province.polygons) {
    assertPolygonIntegrity(province.identity.id, polygon);
    allPolygons.push({ provinceId: province.identity.id, polygon });
  }
}

assert.equal(provinceIds.size, ANATOLIA_PROVINCE_METADATA.length, "Every authoritative 1300 province must have a unique geometry identity");

// A province fragment must never be nested inside another province.  Test
// polygon centroids rather than edges so shared borders are not false positives.
for (const source of allPolygons) {
  const centroid = source.polygon.reduce(
    (sum, [x, y]) => [sum[0] + x, sum[1] + y],
    [0, 0],
  ).map((value) => value / source.polygon.length);
  for (const target of allPolygons) {
    if (source.provinceId === target.provinceId) continue;
    assert.equal(
      pointInPolygon(centroid, target.polygon),
      false,
      `Province nesting/overlap detected: ${source.provinceId} fragment is inside ${target.provinceId}`,
    );
  }
}

// Sample the physical land mask and require exactly one owning province at
// every interior sample. This catches both gaps created by shrink operations
// and overlapping fragments introduced by duplicated coastal polygons.
for (let longitude = 26.55; longitude <= 44.75; longitude += 0.07) {
  for (let latitude = 35.78; latitude <= 42.18; latitude += 0.07) {
    const sample = [longitude, latitude];
    if (!isAtlasLandPoint(sample)) continue;
    const owners = allPolygons.filter(({ polygon }) => pointInPolygon(sample, polygon));
    assert.equal(owners.length, 1, `Physical land partition must have exactly one province at ${longitude.toFixed(2)},${latitude.toFixed(2)}; found ${owners.length}`);
  }
}

// The support-control partition is specifically intended to eliminate the
// oversized eastern cells. Keep a hard upper bound relative to the median so
// a future regression cannot silently recreate a giant eastern province.
const sortedAreas = provinceAreas.map((item) => item.area).sort((a, b) => a - b);
const medianArea = sortedAreas[Math.floor(sortedAreas.length / 2)];
const maxArea = sortedAreas[sortedAreas.length - 1];
assert.ok(maxArea <= medianArea * 5, `Phase 2D contains an oversized province cell: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);

console.log(`Phase 2D geometry integrity passed: ${provinceIds.size} provinces, ${assets.polygonCount} polygons, ${assets.politicalSiteCount} political controls, ${assets.naturalFeatureSiteCount} natural-feature sites.`);
