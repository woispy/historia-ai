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

/** Clip a polyline to BBOX and return independent inside pieces. */
export function clipLineStringToBbox(coordinates, bbox = BBOX) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
  const pieces = [];
  let current = [];
  for (let index = 1; index < coordinates.length; index += 1) {
    const a = coordinates[index - 1];
    const b = coordinates[index];
    if (!Array.isArray(a) || !Array.isArray(b)) continue;
    const clipped = clipSegmentToBbox(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]), bbox);
    if (!clipped) {
      if (current.length >= 2) pieces.push(current);
      current = [];
      continue;
    }
    const start = [clipped[0], clipped[1]];
    const end = [clipped[2], clipped[3]];
    if (!current.length) current.push(start);
    else if (!sameCoordinate(current[current.length - 1], start)) {
      if (current.length >= 2) pieces.push(current);
      current = [start];
    }
    if (!sameCoordinate(current[current.length - 1], end)) current.push(end);
  }
  if (current.length >= 2) pieces.push(current);
  return pieces;
}

function clipSegmentToBbox(x0, y0, x1, y1, bbox) {
  if (![x0, y0, x1, y1].every(Number.isFinite)) return null;
  const [minX, minY, maxX, maxY] = bbox;
  let t0 = 0;
  let t1 = 1;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const tests = [
    [-dx, x0 - minX],
    [dx, maxX - x0],
    [-dy, y0 - minY],
    [dy, maxY - y0],
  ];
  for (const [p, q] of tests) {
    if (Math.abs(p) <= 1e-12) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      t0 = Math.max(t0, r);
    } else {
      if (r < t0) return null;
      t1 = Math.min(t1, r);
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
}

function sameCoordinate(a, b) {
  return Math.abs(a[0] - b[0]) <= 1e-10 && Math.abs(a[1] - b[1]) <= 1e-10;
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

function normalizedName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
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
      const clippedPieces = clipLineStringToBbox(coordinates);
      for (const [pieceIndex, clippedCoordinates] of clippedPieces.entries()) {
        if (clippedCoordinates.length < 2) continue;
        const clippedBounds = boundsForCoordinates(clippedCoordinates);
        output.push({
          id: `river-${sourceLayer}-${index}-${segmentIndex}-${pieceIndex}`,
          name,
          nameEn,
          rank,
          coordinates: clippedCoordinates,
          bounds: [clippedBounds.minX, clippedBounds.minY, clippedBounds.maxX, clippedBounds.maxY],
          sourceLayer,
          geometrySource: "natural-earth-10m",
        });
      }
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
      geometrySource: "natural-earth-10m",
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

const canonicalRiverIdentities = [
  { id: "sakarya", aliases: ["sakarya"] },
  { id: "kizilirmak", aliases: ["kizilirmak", "kizil irmak"] },
  { id: "yesilirmak", aliases: ["yesilirmak", "yesil irmak"] },
  { id: "gediz", aliases: ["gediz"] },
  { id: "buyuk-menderes", aliases: ["buyukmenderes", "buyuk menderes"] },
  { id: "seyhan", aliases: ["seyhan"] },
  { id: "ceyhan", aliases: ["ceyhan"] },
  { id: "firat", aliases: ["firat", "euphrates"] },
  { id: "dicle", aliases: ["dicle", "tigris"] },
];

for (const river of rivers) {
  const searchable = normalizedName(`${river.name} ${river.nameEn}`);
  const identity = canonicalRiverIdentities.find(({ aliases }) => aliases.some((alias) => searchable.includes(normalizedName(alias))));
  if (identity) river.canonicalId = identity.id;
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
