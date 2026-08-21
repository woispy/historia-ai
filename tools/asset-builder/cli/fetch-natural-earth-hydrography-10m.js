#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Pin the upstream repository revision so CI/build output remains reproducible.
// The source revision is the Natural Earth Vector master commit used for this
// P0 foundation; future source upgrades must be deliberate and reviewed.
const NATURAL_EARTH_REVISION = "ca96624a56bd078437bca8184e78163e5039ad19";
const RAW_BASE = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_REVISION}/geojson`;

const SOURCES = [
  {
    key: "lakes",
    url: `${RAW_BASE}/ne_10m_lakes.geojson`,
    output: "src/world/map/source/physical/ne_10m_lakes.geojson",
    geometryTypes: new Set(["Polygon", "MultiPolygon"]),
  },
  {
    key: "lakes_europe",
    url: `${RAW_BASE}/ne_10m_lakes_europe.geojson`,
    output: "src/world/map/source/physical/ne_10m_lakes_europe.geojson",
    geometryTypes: new Set(["Polygon", "MultiPolygon"]),
  },
  {
    key: "rivers",
    url: `${RAW_BASE}/ne_10m_rivers_lake_centerlines.geojson`,
    output: "src/world/map/source/physical/ne_10m_rivers_lake_centerlines.geojson",
    geometryTypes: new Set(["LineString", "MultiLineString", "GeometryCollection"]),
  },
  {
    key: "rivers_europe",
    url: `${RAW_BASE}/ne_10m_rivers_europe.geojson`,
    output: "src/world/map/source/physical/ne_10m_rivers_europe.geojson",
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
  console.log(`Downloaded Natural Earth 10m ${source.key} from ${NATURAL_EARTH_REVISION}: ${json.features.length} GeoJSON features.`);
}
