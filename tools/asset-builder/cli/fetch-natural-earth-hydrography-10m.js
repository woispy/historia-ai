#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCES = [
  {
    key: "lakes",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson",
    output: "src/world/map/source/physical/ne_10m_lakes.geojson",
    geometryTypes: new Set(["Polygon", "MultiPolygon"]),
  },
  {
    key: "rivers",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson",
    output: "src/world/map/source/physical/ne_10m_rivers_lake_centerlines.geojson",
    geometryTypes: new Set(["LineString", "MultiLineString", "GeometryCollection"]),
  },
];

function validateGeoJson(text, source) {
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Natural Earth 10m ${source.key} download failed validation: invalid JSON (${error.message}).`,
      { cause: error },
    );
  }

  if (json?.type !== "FeatureCollection" || !Array.isArray(json.features) || json.features.length === 0) {
    throw new Error(`Natural Earth 10m ${source.key} download failed validation: expected a non-empty GeoJSON FeatureCollection.`);
  }

  const geometryCount = json.features.reduce((count, feature) => {
    const geometry = feature?.geometry;
    if (!geometry) return count;
    if (geometry.type === "GeometryCollection") {
      return count + (Array.isArray(geometry.geometries) ? geometry.geometries.length : 0);
    }
    return count + 1;
  }, 0);

  if (geometryCount === 0) {
    throw new Error(`Natural Earth 10m ${source.key} download failed validation: no geometries found.`);
  }

  for (const feature of json.features.slice(0, 50)) {
    const geometry = feature?.geometry;
    if (!geometry) continue;
    const geometries = geometry.type === "GeometryCollection" ? geometry.geometries ?? [] : [geometry];
    for (const child of geometries) {
      if (!source.geometryTypes.has(child?.type)) {
        throw new Error(`Natural Earth 10m ${source.key} download failed validation: unexpected geometry type ${child?.type ?? "unknown"}.`);
      }
    }
  }

  return json;
}

for (const source of SOURCES) {
  const response = await fetch(source.url, {
    redirect: "follow",
    headers: { "user-agent": "Historia-AI/physical-map-builder" },
  });

  if (!response.ok) {
    throw new Error(`Natural Earth 10m ${source.key} download failed: HTTP ${response.status}`);
  }

  const text = await response.text();
  const json = validateGeoJson(text, source);
  const outputPath = path.resolve(source.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(json)}\n`, "utf8");
  console.log(`Downloaded Natural Earth 10m ${source.key}: ${json.features.length} GeoJSON features.`);
}
