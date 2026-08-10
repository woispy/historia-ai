import fs from "node:fs/promises";

const HISTORICAL_1300_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1300.geojson";

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
  return ring
    .filter((coordinate) => Array.isArray(coordinate) && coordinate.length >= 2)
    .map(([longitude, latitude]) => [
      Number(longitude),
      Number(latitude),
    ]);
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

function slug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeHistoricalFeature(feature, index) {
  const properties = feature?.properties ?? {};
  const polygons = extractPolygons(feature?.geometry);
  const sourceName =
    properties.NAME ??
    properties.name ??
    `Historical Region ${index + 1}`;
  const sourceFeatureId = String(
    feature?.id ??
    properties.ID ??
    properties.id ??
    sourceName,
  ).trim();

  if (!polygons.length) return null;

  return {
    id: `historical_1300_${slug(sourceFeatureId) || index}`,
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

export async function importHistoricalGeoJson(inputPath) {
  const raw = await fs.readFile(inputPath, "utf8");
  const geojson = JSON.parse(raw);
  assertGeoJson(geojson);

  return geojson.features
    .map(normalizeHistoricalFeature)
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
