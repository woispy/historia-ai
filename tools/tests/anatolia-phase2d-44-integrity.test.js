import assert from "node:assert/strict";

import {
  buildAnatoliaPhase2DAssets,
  isPhysicalLandPoint,
} from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA_44 } from "../../src/map/data/AnatoliaProvinceMetadata44.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";

const result = buildAnatoliaPhase2DAssets();

assert.equal(result.historicalDate, "1300-01-01");
assert.equal(result.provinceCount, 44);
assert.equal(result.provinceCount, ANATOLIA_PROVINCE_METADATA_44.length);
assert.equal(result.politicalSiteCount, 44);
assert.equal(result.supportSiteCount, 0);
assert.equal(result.fallbackProvinceCount, 0);
assert.equal(result.polygonCount, 44);
assert.equal(result.provinces.length, 44);
assert.equal(result.geometries.length, 44);
assert.ok(result.siteCount >= 1000, "Phase 2D must retain a dense physical/cartographic site field");

const requiredExpansionIds = [
  "pamphylia-attaleia",
  "lycia-myra",
  "pisidia-antioch",
  "cappadocia-nigde",
  "eastern-anatolia-malatya",
  "cilicia-adana",
];

const generatedIds = new Set(result.provinces.map((province) => province.identity.id));
for (const id of requiredExpansionIds) assert.equal(generatedIds.has(id), true, `Missing 44-province expansion anchor: ${id}`);

function polygonArea(polygon) {
  let total = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    total += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(total) / 2;
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

function polygonCentroid(polygon) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    twiceArea += cross;
    x += (current[0] + next[0]) * cross;
    y += (current[1] + next[1]) * cross;
  }
  if (Math.abs(twiceArea) < 1e-12) return polygon[0];
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function atlasLandPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))
    && !ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

const allPolygons = [];
const areas = [];
const ids = new Set();

for (const province of result.provinces) {
  assert.equal(ids.has(province.identity.id), false, `Duplicate province geometry: ${province.identity.id}`);
  ids.add(province.identity.id);
  assert.equal(province.polygons.length, 1, `${province.identity.id}: province must be one contiguous polygon`);
  const polygon = province.polygons[0];
  assert.ok(polygon.length >= 3, `${province.identity.id}: polygon must have at least three vertices`);
  const totalArea = polygonArea(polygon);
  assert.ok(totalArea >= 0.00005, `${province.identity.id}: polygon is fallback-sized`);
  areas.push(totalArea);
  allPolygons.push({ provinceId: province.identity.id, polygon });

  const centroid = polygonCentroid(polygon);
  assert.equal(isPhysicalLandPoint(centroid), true, `${province.identity.id}: polygon centroid must be physical land`);
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    assert.equal(isPhysicalLandPoint(start), true, `${province.identity.id}: vertex is not physical land`);
    for (const fraction of [0.25, 0.5, 0.75]) {
      const sample = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      assert.equal(isPhysicalLandPoint(sample), true, `${province.identity.id}: edge crosses physical water`);
    }
  }
}

assert.equal(ids.size, 44);

// No province may be nested inside another province. This directly guards the
// regression where detached pieces appeared inside a neighbouring province.
for (const source of allPolygons) {
  const probes = [polygonCentroid(source.polygon), ...source.polygon];
  for (const target of allPolygons) {
    if (source.provinceId === target.provinceId) continue;
    for (const probe of probes) {
      assert.equal(
        pointInPolygon(probe, target.polygon),
        false,
        `Province nesting/overlap detected: ${source.provinceId} enters ${target.provinceId}`,
      );
    }
  }
}

// Every sampled mainland point must have exactly one province owner. Lakes are
// excluded from this partition because they are physical water, not province land.
for (let longitude = 26.55; longitude <= 44.75; longitude += 0.07) {
  for (let latitude = 35.78; latitude <= 42.18; latitude += 0.07) {
    const sample = [longitude, latitude];
    if (!atlasLandPoint(sample)) continue;
    const owners = allPolygons.filter(({ polygon }) => pointInPolygon(sample, polygon));
    assert.equal(owners.length, 1, `Mainland partition gap/overlap at ${longitude.toFixed(2)},${latitude.toFixed(2)}: ${owners.length}`);
  }
}

// The previous regression produced oversized empty eastern provinces. Keep a
// hard area-ratio guard so the eastern frontier cannot silently absorb the map.
const sortedAreas = [...areas].sort((a, b) => a - b);
const medianArea = sortedAreas[Math.floor(sortedAreas.length / 2)];
const maxArea = sortedAreas[sortedAreas.length - 1];
assert.ok(maxArea <= medianArea * 3.8, `Oversized province cell: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);

// New southern anchors must actually land on their intended geography.
const expectedAnchors = {
  "pamphylia-attaleia": [30.70, 36.89],
  "lycia-myra": [29.99, 36.26],
  "pisidia-antioch": [30.56, 38.30],
  "cappadocia-nigde": [34.68, 37.97],
  "eastern-anatolia-malatya": [38.35, 38.35],
  "cilicia-adana": [35.32, 37.00],
};
for (const [id, anchor] of Object.entries(expectedAnchors)) {
  assert.equal(isPhysicalLandPoint(anchor), true, `${id}: historical anchor is not on physical land`);
}

for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
  const lakeCentroid = polygonCentroid(lake.coordinates);
  const owners = allPolygons.filter(({ polygon }) => pointInPolygon(lakeCentroid, polygon));
  assert.equal(owners.length, 0, `Lake centroid is owned by a province: ${lake.name ?? "unnamed lake"}`);
}

console.log(
  `Phase 2D V9 integrity passed: ${result.provinceCount} contiguous provinces, `
  + `${result.polygonCount} polygons, ${result.politicalSiteCount} political anchors, `
  + `${result.weightIterations} weight iterations.`,
);
