import fs from "node:fs/promises";

function assertGeoJson(input) {
  if (!input || input.type !== "FeatureCollection" || !Array.isArray(input.features)) {
    throw new Error("Historical GIS input must be a GeoJSON FeatureCollection.");
  }
}

function normalizePolygonCoordinates(coordinates) {
  return coordinates.map((ring) =>
    ring.map(([longitude, latitude]) => [Number(longitude), Number(latitude)])
  );
}

function extractPolygons(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [normalizePolygonCoordinates(geometry.coordinates)];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map(normalizePolygonCoordinates);
  }

  return [];
}

export function normalizeHistoricalFeature(feature, index) {
  const properties = feature?.properties ?? {};
  const polygons = extractPolygons(feature?.geometry);
  const sourceName = properties.NAME ?? properties.name ?? `Historical Region ${index + 1}`;
  const sourceId = String(
    feature?.id ??
    properties.ID ??
    properties.id ??
    sourceName,
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!polygons.length) return null;

  return {
    id: `historical_1300_${sourceId || index}`,
    name: sourceName,
    subject: properties.SUBJECTO ?? properties.subject ?? null,
    partOf: properties.PARTOF ?? properties.partof ?? null,
    borderPrecision: Number(properties.BORDERPRECISION ?? properties.borderPrecision ?? 1),
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
