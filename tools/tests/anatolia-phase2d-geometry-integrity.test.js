import assert from "node:assert/strict";

import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

const assets = buildAnatoliaPhase2DAssets();
assert.equal(assets.provinceCount, ANATOLIA_PROVINCE_METADATA.length, "Phase 2D province count must match metadata");
assert.equal(assets.provinceCount, 38, "Phase 2D must match the current authoritative 1300 province dataset");
assert.equal(assets.politicalSiteCount, 38, "Phase 2D must use exactly one political anchor per province");
assert.equal(assets.supportSiteCount, 0, "Phase 2D must not create detached support-control province fragments");
assert.ok(Number.isInteger(assets.weightIterations), "Phase 2D must expose deterministic weight-solver iterations");

function polygonArea(polygon) { let result = 0; for (let index = 0; index < polygon.length; index += 1) { const current = polygon[index]; const next = polygon[(index + 1) % polygon.length]; result += current[0] * next[1] - next[0] * current[1]; } return Math.abs(result) / 2; }
function pointOnSegment(point, start, end, tolerance = 1e-9) { const dx = end[0] - start[0]; const dy = end[1] - start[1]; const cross = dx * (point[1] - start[1]) - dy * (point[0] - start[0]); if (Math.abs(cross) > tolerance) return false; return point[0] >= Math.min(start[0], end[0]) - tolerance && point[0] <= Math.max(start[0], end[0]) + tolerance && point[1] >= Math.min(start[1], end[1]) - tolerance && point[1] <= Math.max(start[1], end[1]) + tolerance; }
function pointInPolygon(point, polygon) { let inside = false; for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) { const current = polygon[index]; const before = polygon[previous]; if (pointOnSegment(point, before, current)) return true; if ((current[1] > point[1]) !== (before[1] > point[1]) && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || 1e-12) + current[0]) inside = !inside; } return inside; }
function pointInStrictPolygon(point, polygon) { if (polygon.some((vertex, index) => pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length]))) return false; return pointInPolygon(point, polygon); }
function pointToSegmentDistance(point, start, end) { const dx = end[0] - start[0]; const dy = end[1] - start[1]; const denominator = dx * dx + dy * dy; const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator)); const projection = [start[0] + dx * t, start[1] + dy * t]; return Math.hypot(point[0] - projection[0], point[1] - projection[1]); }
function pointOnPolygonBoundary(point, polygon, tolerance = 1e-7) { for (let index = 0; index < polygon.length; index += 1) if (pointToSegmentDistance(point, polygon[index], polygon[(index + 1) % polygon.length]) <= tolerance) return true; return false; }
function followsLakeShoreline(point, lake) { return lake.rings?.some((ring) => pointOnPolygonBoundary(point, ring)) || pointOnPolygonBoundary(point, lake.coordinates); }
function isLakeShorelinePoint(point) { return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => followsLakeShoreline(point, lake)); }
function polygonCentroid(polygon) { return polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length); }
function ownedByGeometry(point, geometry) { const outer = geometry.polygons[0]; if (!pointInStrictPolygon(point, outer)) return false; return !(geometry.holes ?? []).some((hole) => pointInStrictPolygon(point, hole)); }
function isAtlasLandPoint(point) { const landPolygons = [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((correction) => correction.coordinates)]; return landPolygons.some((polygon) => pointInPolygon(point, polygon)) && !ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates)); }

const fallbackLikeProvinceIds = assets.geometries.filter((geometry) => geometry.polygons.some((polygon) => polygonArea(polygon) < 0.00005)).map((geometry) => geometry.identity.provinceId);
assert.equal(assets.fallbackProvinceCount, 0, `Phase 2D must not silently create fallback polygons: ${fallbackLikeProvinceIds.join(", ")}`);
assert.equal(fallbackLikeProvinceIds.length, 0, `Phase 2D contains fallback-sized province geometry: ${fallbackLikeProvinceIds.join(", ")}`);
assert.ok(assets.naturalFeatureSiteCount > 0, "Natural-feature control sites must participate in geometry generation");
assert.equal(assets.polygonCount, 38, "The authoritative mainland partition must contain exactly one outer polygon per province");
assert.ok(assets.physicalBarrierSiteCount > 0, "Physical coastline and lake boundaries must participate as non-political geometry barriers");

const provinceIds = new Set(); const allGeometries = []; const provinceAreas = [];
function assertRingIntegrity(provinceId, ring, label) {
  assert.ok(ring.length >= 3, `${provinceId}: ${label} must contain at least three vertices`);
  for (const point of ring) assert.equal(isPhysicalLandPoint(point) || isLakeShorelinePoint(point), true, `${provinceId}: ${label} vertex must remain on physical land or a real lake shoreline`);
  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index]; const end = ring[(index + 1) % ring.length];
    for (const fraction of [0.25, 0.5, 0.75]) {
      const sample = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      assert.equal(isPhysicalLandPoint(sample) || isLakeShorelinePoint(sample), true, `${provinceId}: ${label} edge crosses physical water away from land/lake shoreline near ${fraction}`);
    }
  }
}

for (const geometry of assets.geometries) {
  const provinceId = geometry.identity.provinceId;
  assert.equal(provinceIds.has(provinceId), false, `Duplicate province geometry: ${provinceId}`);
  provinceIds.add(provinceId);
  const province = assets.provinces.find((item) => item.identity.id === provinceId);
  assert.ok(province, `${provinceId}: province asset must exist for geometry metadata contract`);
  assert.equal(province.header.dataset, "anatolia-province-geometry-1300");
  assert.match(province.header.generator, /Phase 2D Geometry Builder V16/);
  assert.equal(province.historical.classification, "phase2d-anatolia-province-geometry");
  assert.equal(geometry.polygons.length, 1, `${provinceId}: province must be one contiguous mainland polygon, not detached fragments`);
  assert.ok(Array.isArray(geometry.holes), `${provinceId}: lake holes must be explicit geometry metadata`);
  assertRingIntegrity(provinceId, geometry.polygons[0], "outer ring");
  for (const hole of geometry.holes) {
    assert.ok(hole.length >= 3, `${provinceId}: lake hole must contain at least three vertices`);
    assert.ok(hole.every((point) => ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => followsLakeShoreline(point, lake))), `${provinceId}: lake hole must follow a real lake shoreline`);
  }
  provinceAreas.push({ id: provinceId, area: polygonArea(geometry.polygons[0]) }); allGeometries.push(geometry);
}

assert.equal(provinceIds.size, ANATOLIA_PROVINCE_METADATA.length, "Every authoritative 1300 province must have a unique geometry identity");
assert.equal(allGeometries.length, 38, "The 1300 Anatolia mainland partition must contain exactly 38 province geometries");
const egirdir = allGeometries.find((geometry) => geometry.identity.provinceId === "pisidia-egirdir");
assert.ok(egirdir, "Eğirdir province geometry must exist");
assert.deepEqual(egirdir.identity.historicalAnchor, [30.85, 37.87], "Eğirdir historical anchor must remain unchanged");
assert.ok(polygonArea(egirdir.polygons[0]) >= 0.00005, "Eğirdir must have real contiguous physical-land geometry, not a fallback placeholder");
const egirdirLake = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.find((lake) => pointInPolygon(polygonCentroid(lake.coordinates), egirdir.polygons[0]));
if (egirdirLake) { const lakeFullyContained = egirdirLake.coordinates.every((point) => pointInPolygon(point, egirdir.polygons[0]) || isLakeShorelinePoint(point)); if (lakeFullyContained) assert.ok(egirdir.holes.length > 0, "Eğirdir must retain the real lake as an explicit hole when its outer province polygon fully contains the lake"); }

for (const source of allGeometries) {
  const probes = [polygonCentroid(source.polygons[0]), ...source.polygons[0]];
  for (const target of allGeometries) {
    if (source.identity.provinceId === target.identity.provinceId) continue;
    for (const probe of probes) {
      assert.equal(ownedByGeometry(probe, target), false, `Province nesting/overlap detected: ${source.identity.provinceId} enters ${target.identity.provinceId} at probe [${probe[0].toFixed(10)},${probe[1].toFixed(10)}]`);
    }
  }
}

for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) { const centroid = polygonCentroid(lake.coordinates); const owners = allGeometries.filter((geometry) => ownedByGeometry(centroid, geometry)); assert.equal(owners.length, 0, `Lake centroid must not be owned by a province: ${lake.name ?? "unnamed lake"}`); }
for (let longitude = 26.55; longitude <= 44.75; longitude += 0.07) for (let latitude = 35.78; latitude <= 42.18; latitude += 0.07) { const sample = [longitude, latitude]; if (!isAtlasLandPoint(sample)) continue; const owners = allGeometries.filter((geometry) => ownedByGeometry(sample, geometry)); assert.equal(owners.length, 1, `Physical land partition must have exactly one province at ${longitude.toFixed(2)},${latitude.toFixed(2)}; found ${owners.length}`); }

const sortedAreas = provinceAreas.map((item) => item.area).sort((a, b) => a - b); const medianArea = sortedAreas[Math.floor(sortedAreas.length / 2)]; const maxArea = sortedAreas[sortedAreas.length - 1];
assert.ok(maxArea <= medianArea * 4.2, `Phase 2D contains an oversized province cell: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);
console.log(`Phase 2D V16 geometry integrity passed: ${provinceIds.size} contiguous provinces, ${assets.polygonCount} outer polygons, ${assets.politicalSiteCount} political anchors, ${assets.physicalBarrierSiteCount} physical boundary barriers, ${assets.weightIterations} weight iterations, ${assets.geometries.reduce((sum, geometry) => sum + geometry.holes.length, 0)} lake holes.`);