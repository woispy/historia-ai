import fs from "node:fs/promises";

import { createHistoricalAssetId, slug } from "./HistoricalAssetId.js";

const HISTORICAL_1300_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1300.geojson";
const POINT_EPSILON = 1e-9;

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

function normalizeRing(ring) {
  const points = [];

  for (const coordinate of ring) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue;

    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;

    const point = [longitude, latitude];
    const previous = points[points.length - 1];
    if (previous && samePoint(previous, point)) continue;
    points.push(point);
  }

  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  // Historical GIS sources can contain rings that retrace an earlier path.
  // Ear clipping cannot triangulate such zero-area/self-retracing rings. When
  // a vertex occurs again, erase the closed loop between its occurrences while
  // preserving the remaining boundary.
  let changed = true;
  while (changed && points.length >= 3) {
    changed = false;

    for (let start = 0; start < points.length; start += 1) {
      const repeated = findRepeatedPoint(points, start + 1);
      if (repeated < 0) continue;

      points.splice(start + 1, repeated - start - 1);
      removeAdjacentDuplicates(points);
      changed = true;
      break;
    }
  }

  removeAdjacentDuplicates(points);
  if (points.length < 3 || Math.abs(signedArea(points)) <= 1e-12) return [];

  points.push([...points[0]]);
  return points;
}

function findRepeatedPoint(points, start) {
  for (let index = start; index < points.length; index += 1) {
    if (samePoint(points[start - 1], points[index])) return index;
  }

  return -1;
}

function removeAdjacentDuplicates(points) {
  for (let index = points.length - 1; index > 0; index -= 1) {
    if (samePoint(points[index - 1], points[index])) points.splice(index, 1);
  }
}

function signedArea(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }

  return area * 0.5;
}

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) <= POINT_EPSILON &&
    Math.abs(a[1] - b[1]) <= POINT_EPSILON;
}

function extractPolygons(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    const outerRing = normalizeRing(geometry.coordinates?.[0] ?? []);
    return outerRing.length >= 3 ? [outerRing] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => normalizeRing(polygon?.[0] ?? []))
      .filter((ring) => ring.length >= 3);
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
