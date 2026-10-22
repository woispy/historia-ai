#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const NATURAL_EARTH_REVISION = "ca96624a56bd078437bca8184e78163e5039ad19";
const SOURCE_LAYER = "ne_10m_rivers_lake_centerlines";
const SOURCE_PATH = path.resolve(
  process.argv[2] ?? "src/world/map/source/physical/ne_10m_rivers_lake_centerlines.geojson",
);
const OUTPUT_PATH = path.resolve(
  process.argv[3] ?? "data/gis/1326/physical-reference-intake/sakarya-source-candidates.json",
);
const TARGET_ALIASES = new Set(["sakarya"]);

function normalizedName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  // Geometry coordinate arrays preserve source order; stringify is deliberate
  // so the digest is reproducible for the same pinned source payload.
  return JSON.stringify(value);
}

function featureNameValues(properties = {}) {
  return [
    properties.name,
    properties.name_en,
    properties.nameascii,
    properties.name_alt,
    properties.namealt,
  ].filter((value) => typeof value === "string" && value.trim());
}

function hasCoordinatePair(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]));
}

function validateGeometry(geometry, label) {
  if (!geometry || !["LineString", "MultiLineString", "GeometryCollection"].includes(geometry.type)) {
    throw new Error(`${label}: expected line geometry, received ${geometry?.type ?? "null"}.`);
  }

  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (hasCoordinatePair(value)) {
      const lon = Number(value[0]);
      const lat = Number(value[1]);
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new Error(`${label}: coordinate outside WGS84 bounds.`);
      }
      return;
    }
    for (const child of value) visit(child);
  };

  visit(geometry.coordinates);
  for (const child of geometry.geometries ?? []) validateGeometry(child, label);
}

const raw = await readFile(SOURCE_PATH, "utf8");
const source = JSON.parse(raw);
if (source?.type !== "FeatureCollection" || !Array.isArray(source.features)) {
  throw new Error(`Invalid Natural Earth GeoJSON FeatureCollection: ${SOURCE_PATH}`);
}

const candidates = [];
for (const [featureIndex, feature] of source.features.entries()) {
  const names = featureNameValues(feature?.properties);
  const matchedNames = [...new Set(names.filter((name) => TARGET_ALIASES.has(normalizedName(name))))];
  if (matchedNames.length === 0) continue;
  validateGeometry(feature.geometry, `source feature index ${featureIndex}`);

  const geometryJson = stableJson(feature.geometry);
  const featureJson = stableJson({
    type: feature.type,
    properties: feature.properties ?? {},
    geometry: feature.geometry,
  });

  candidates.push({
    sourceLocator: {
      repository: "nvkelso/natural-earth-vector",
      revision: NATURAL_EARTH_REVISION,
      layer: SOURCE_LAYER,
      featureIndex,
      featureId: feature.id ?? feature.properties?.ne_id ?? feature.properties?.fid ?? null,
      featureIdSemantics: feature.id != null || feature.properties?.ne_id != null || feature.properties?.fid != null
        ? "source-provided-id"
        : "no-source-id; revision-scoped featureIndex plus content hashes only",
    },
    matchedNames,
    sourceProperties: feature.properties ?? {},
    geometryType: feature.geometry.type,
    crs: "EPSG:4326",
    sourceGeometrySha256: sha256(geometryJson),
    sourceFeatureSha256: sha256(featureJson),
    geometry: feature.geometry,
  });
}

if (candidates.length === 0) {
  throw new Error("No exact normalized Sakarya name match found in the pinned Natural Earth river centerline source; refusing to create an empty intake record.");
}

const payload = {
  schemaVersion: 1,
  status: "CANDIDATES_EXTRACTED_REVIEW_REQUIRED",
  canonicalPhysicalFeature: "sakarya",
  historicalName: "Sangarios",
  authority: "non-authoritative physical-reference evidence",
  source: {
    provider: "Natural Earth Vector",
    revision: NATURAL_EARTH_REVISION,
    layer: SOURCE_LAYER,
    path: path.relative(process.cwd(), SOURCE_PATH).replaceAll(path.sep, "/"),
    crs: "EPSG:4326",
    selection: "exact normalized equality against name/name_en/nameascii/name_alt/namealt; matched labels are deduplicated; no substring or endpoint-distance selection",
    clipping: "none; original source feature geometry is retained",
    sourceFileSha256: sha256(raw),
  },
  candidateCount: candidates.length,
  candidates,
  limitations: [
    "Natural Earth river centerlines are generalized physical geography, not a medieval political boundary.",
    "A name match does not establish the precise 1326 river course or a medieval route endpoint.",
    "If the source provides no durable feature ID, featureIndex is valid only for the pinned revision and must be paired with content hashes.",
    "Human review is required before selecting any candidate or resolving the Lefke-Sangarios route endpoint.",
  ],
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Extracted ${candidates.length} Sakarya source candidate(s) to ${OUTPUT_PATH}`);
console.log(`Natural Earth revision: ${NATURAL_EARTH_REVISION}; source file SHA-256: ${payload.source.sourceFileSha256}`);
console.log("No candidate was promoted to a historical boundary or route endpoint.");
