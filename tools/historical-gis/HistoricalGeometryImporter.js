import fs from "node:fs/promises";

import { createHistoricalAssetId, slug } from "./HistoricalAssetId.js";

const HISTORICAL_1300_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1300.geojson";
const GEOMETRY_EPSILON = 1e-10;

function assertGeoJson(input) {
  if (
    !input ||
    input.type !== "FeatureCollection" ||
    !Array.isArray(input.features)
  ) {
    throw new Error(
      "Historical GIS input must be a GeoJSON FeatureCollection.",
    );
  }
}

function samePoint(a, b) {
  return (
    Math.abs(a[0] - b[0]) <= GEOMETRY_EPSILON &&
    Math.abs(a[1] - b[1]) <= GEOMETRY_EPSILON
  );
}

function cross(a, b, c) {
  return (
    (b[0] - a[0]) * (c[1] - a[1]) -
    (b[1] - a[1]) * (c[0] - a[0])
  );
}

function signedArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function ringScale(ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of ring) {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return Math.max(1, Math.hypot(maxX - minX, maxY - minY));
}

function areaTolerance(ring) {
  const scale = ringScale(ring);
  return Math.max(Number.EPSILON * scale * scale * 16, GEOMETRY_EPSILON * scale * scale);
}

function canonicalizeRing(ring) {
  const output = [];
  for (const coordinate of ring) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    const point = [longitude, latitude];
    if (!output.length || !samePoint(output[output.length - 1], point)) {
      output.push(point);
    }
  }

  if (output.length > 1 && samePoint(output[0], output[output.length - 1])) {
    output.pop();
  }

  let changed = true;
  let guard = 0;
  while (changed && output.length > 3 && guard < output.length * 2) {
    changed = false;
    guard += 1;
    for (let index = 0; index < output.length && output.length > 3; index += 1) {
      const previous = output[(index - 1 + output.length) % output.length];
      const current = output[index];
      const next = output[(index + 1) % output.length];
      if (Math.abs(cross(previous, current, next)) <= GEOMETRY_EPSILON) {
        output.splice(index, 1);
        changed = true;
        index -= 1;
      }
    }
  }

  if (output.length < 3) return null;
  if (Math.abs(signedArea(output)) <= areaTolerance(output)) return null;
  return output;
}

function normalizeRing(ring) {
  return canonicalizeRing(ring);
}

function extractPolygons(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    const outerRing = normalizeRing(geometry.coordinates?.[0] ?? []);
    return outerRing ? [outerRing] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => normalizeRing(polygon?.[0] ?? []))
      .filter(Boolean);
  }

  return [];
}

function compressAntarctica(polygons, sourceName) {
  if (!/antarctica/i.test(String(sourceName ?? ""))) return polygons;

  // Keep Antarctica as a small visual footer rather than allowing the raw
  // geographic extent (-90 to roughly -60) to dominate the playable map.
  // The source's southern edge remains anchored at -90 while the full
  // continent is compressed to roughly 5.4 degrees of latitude.
  const pivotLatitude = -90;
  const verticalScale = 0.18;

  return polygons.map((ring) =>
    ring.map(([longitude, latitude]) => [
      longitude,
      pivotLatitude + (latitude - pivotLatitude) * verticalScale,
    ]),
  );
}

export function normalizeHistoricalFeature(feature, index, year = 1300) {
  const properties = feature?.properties ?? {};
  const sourceName =
    properties.NAME ??
    properties.name ??
    `Historical Region ${index + 1}`;
  const polygons = compressAntarctica(
    extractPolygons(feature?.geometry),
    sourceName,
  );
  const sourceFeatureId = String(
    feature?.id ??
    properties.ID ??
    properties.id ??
    sourceName,
  ).trim();

  if (!polygons.length) return null;

  return {
    id: `historical_${year}_${slug(sourceFeatureId) || index}`,
    assetId: createHistoricalAssetId({
      year,
      sourceFeatureId,
      sourceFeatureIndex: index,
    }),
    sourceFeatureIndex: index,
    sourceFeatureId,
    sourceName,
    name: sourceName,
    subject: properties.SUBJECTO ?? properties.subject ?? null,
    partOf: properties.PARTOF ?? properties.partof ?? null,
    borderPrecision: Number(
      properties.BORDERPRECISION ?? properties.borderPrecision ?? 1,
    ),
    polygons,
  };
}

export async function importHistoricalGeoJson(inputPath, year = 1300) {
  const raw = await fs.readFile(inputPath, "utf8");
  const geojson = JSON.parse(raw);
  assertGeoJson(geojson);

  return geojson.features
    .map((feature, index) => normalizeHistoricalFeature(feature, index, year))
    .filter(Boolean);
}

export async function downloadHistorical1300GeoJson(outputPath) {
  const response = await fetch(HISTORICAL_1300_URL);

  if (!response.ok) {
    throw new Error(
      `Unable to download historical 1300 GIS source: ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text();
  const geojson = JSON.parse(text);
  assertGeoJson(geojson);
  await fs.writeFile(outputPath, `${JSON.stringify(geojson)}\n`, "utf8");

  return {
    url: HISTORICAL_1300_URL,
    featureCount: geojson.features.length,
  };
}

export { HISTORICAL_1300_URL };