#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BBOX = [24.0, 34.0, 45.2, 43.2];
const SOURCE_ROOT = path.resolve("src/world/map/source/physical");
const OUTPUT = path.resolve("src/map/data/generated/anatolia-hydrography-10m.json");

function flattenPoints(value, result = []) {
  if (!Array.isArray(value)) return result;
  if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
    result.push([Number(value[0]), Number(value[1])]);
    return result;
  }
  for (const child of value) flattenPoints(child, result);
  return result;
}

function boundsForCoordinates(coordinates) {
  const points = flattenPoints(coordinates);
  if (!points.length) return null;
  return points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y),
  }), {
    minX: points[0][0],
    minY: points[0][1],
    maxX: points[0][0],
    maxY: points[0][1],
  });
}

function intersectsBbox(bounds) {
  if (!bounds) return false;
  return !(bounds.maxX < BBOX[0] || bounds.minX > BBOX[2] || bounds.maxY < BBOX[1] || bounds.minY > BBOX[3]);
}

function featureName(properties, index) {
  return String(
    properties?.name
      ?? properties?.name_en
      ?? properties?.nameascii
      ?? properties?.name_alt
      ?? `Unnamed hydrography ${index}`,
  ).trim();
}

function rankFromProperties(properties) {
  const rank = Number(properties?.scalerank ?? properties?.rank ?? 9);
  return Number.isFinite(rank) ? Math.max(1, Math.round(rank)) : 9;
}

function geometryKey(value) {
  return JSON.stringify(value);
}

function addGeometry(geometry, properties, index, kind, output, sourceLayer) {
  if (!geometry) return;
  if (geometry.type === "GeometryCollection") {
    for (const [childIndex, child] of geometry.geometries.entries()) {
      addGeometry(child, properties, `${index}-${childIndex}`, kind, output, sourceLayer);
    }
    return;
  }

  const name = featureName(properties, index);
  const nameEn = String(properties?.name_en ?? properties?.name ?? name).trim();
  const rank = rankFromProperties(properties);

  if (kind === "river") {
    const lines = geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.type === "MultiLineString"
        ? geometry.coordinates
        : [];
    for (const [segmentIndex, coordinates] of lines.entries()) {
      const bounds = boundsForCoordinates(coordinates);
      if (!intersectsBbox(bounds) || coordinates.length < 2) continue;
      output.push({
        id: `river-${sourceLayer}-${index}-${segmentIndex}`,
        name,
        nameEn,
        rank,
        coordinates,
        bounds: [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY],
        sourceLayer,
      });
    }
    return;
  }

  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : [];
  for (const [polygonIndex, rings] of polygons.entries()) {
    const bounds = boundsForCoordinates(rings);
    if (!intersectsBbox(bounds) || !rings?.[0]?.length) continue;
    output.push({
      id: `lake-${sourceLayer}-${index}-${polygonIndex}`,
      name,
      nameEn,
      rank,
      rings,
      bounds: [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY],
      sourceLayer,
    });
  }
}

async function readGeoJson(fileName) {
  const text = await readFile(path.join(SOURCE_ROOT, fileName), "utf8");
  const json = JSON.parse(text);
  if (json?.type !== "FeatureCollection" || !Array.isArray(json.features)) {
    throw new Error(`Invalid Natural Earth GeoJSON: ${fileName}`);
  }
  return json.features;
}

const [europeLakeFeatures, baseLakeFeatures, europeRiverFeatures, baseRiverFeatures] = await Promise.all([
  readGeoJson("ne_10m_lakes_europe.geojson"),
  readGeoJson("ne_10m_lakes.geojson"),
  readGeoJson("ne_10m_rivers_europe.geojson"),
  readGeoJson("ne_10m_rivers_lake_centerlines.geojson"),
]);

const lakes = [];
const rivers = [];
const seenLakeGeometry = new Set();
const seenRiverGeometry = new Set();

// Natural Earth's Europe supplement has precedence because it supplies the
// denser regional hydrography intended for country/region maps. The base 10m
// theme fills gaps not present in the supplement. Exact duplicate geometry is
// emitted only once.
for (const [index, feature] of europeLakeFeatures.entries()) {
  addGeometry(feature.geometry, feature.properties, index, "lake", lakes, "natural-earth-10m-europe");
}
for (const lake of lakes) seenLakeGeometry.add(geometryKey(lake.rings));

for (const [index, feature] of baseLakeFeatures.entries()) {
  const candidates = [];
  addGeometry(feature.geometry, feature.properties, index, "lake", candidates, "natural-earth-10m");
  for (const lake of candidates) {
    const key = geometryKey(lake.rings);
    if (seenLakeGeometry.has(key)) continue;
    seenLakeGeometry.add(key);
    lakes.push(lake);
  }
}

for (const [index, feature] of europeRiverFeatures.entries()) {
  const candidates = [];
  addGeometry(feature.geometry, feature.properties, index, "river", candidates, "natural-earth-10m-europe");
  for (const river of candidates) {
    const key = geometryKey(river.coordinates);
    if (seenRiverGeometry.has(key)) continue;
    seenRiverGeometry.add(key);
    rivers.push(river);
  }
}

for (const [index, feature] of baseRiverFeatures.entries()) {
  const candidates = [];
  addGeometry(feature.geometry, feature.properties, index, "river", candidates, "natural-earth-10m");
  for (const river of candidates) {
    const key = geometryKey(river.coordinates);
    if (seenRiverGeometry.has(key)) continue;
    seenRiverGeometry.add(key);
    rivers.push(river);
  }
}

lakes.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
rivers.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const payload = {
  version: 2,
  source: "Natural Earth 10m lakes + Europe supplement + rivers_lake_centerlines + Europe supplement",
  projection: "EPSG:4326",
  bbox: BBOX,
  lakes,
  rivers,
};

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload)}\n`, "utf8");
console.log(`Built ${lakes.length} lake polygons and ${rivers.length} river segments for the Anatolia physical atlas.`);
