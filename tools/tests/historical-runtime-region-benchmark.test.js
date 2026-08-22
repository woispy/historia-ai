#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src/world/map/assets/historical");
const YEAR = "1300";
const RUNTIME_ROOT = path.join(ROOT, YEAR);
const REGIONS_ROOT = path.join(RUNTIME_ROOT, "regions");
const MAX_REGION_BYTES = 512 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

const manifestPath = path.join(RUNTIME_ROOT, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.assetType !== "historical-runtime-manifest") {
  throw new Error("Historical runtime manifest has an unexpected asset type.");
}
if (manifest.historicalDate !== `${YEAR}-01-01`) {
  throw new Error(`Historical runtime manifest date mismatch: ${manifest.historicalDate}`);
}
if (!Array.isArray(manifest.regions) || manifest.regions.length < 2) {
  throw new Error("Historical runtime must contain multiple regional assets.");
}

const regionFiles = (await readdir(REGIONS_ROOT, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();

if (regionFiles.length !== manifest.regions.length) {
  throw new Error(
    `Historical runtime manifest/file mismatch: ${manifest.regions.length} manifest regions vs ${regionFiles.length} files.`,
  );
}

const rows = [];
let totalBytes = 0;
let largest = null;

for (const region of manifest.regions) {
  const filePath = path.join(RUNTIME_ROOT, region.file);
  const bytes = (await stat(filePath)).size;
  const asset = JSON.parse(await readFile(filePath, "utf8"));

  if (asset.assetType !== "historical-runtime-region") {
    throw new Error(`Unexpected asset type for historical region ${region.id}.`);
  }
  if (asset.regionId !== region.id) {
    throw new Error(`Historical region identity mismatch for ${region.id}.`);
  }
  if (asset.counts.provinces !== region.provinceCount) {
    throw new Error(`Historical region province count mismatch for ${region.id}.`);
  }
  if (asset.counts.geometries !== region.geometryCount) {
    throw new Error(`Historical region geometry count mismatch for ${region.id}.`);
  }
  if (asset.counts.polygons !== region.polygonCount) {
    throw new Error(`Historical region polygon count mismatch for ${region.id}.`);
  }

  if (bytes > MAX_REGION_BYTES) {
    throw new Error(
      `Historical runtime region ${region.id} is ${formatBytes(bytes)}, above the ${formatBytes(MAX_REGION_BYTES)} payload budget. Split the spatial region before expanding the world dataset.`,
    );
  }

  totalBytes += bytes;
  const row = { id: region.id, bytes, provinces: region.provinceCount, geometries: region.geometryCount };
  rows.push(row);
  if (!largest || bytes > largest.bytes) largest = row;
}

const averageBytes = totalBytes / rows.length;
const maxShare = largest.bytes / totalBytes;

if (maxShare > 0.60) {
  throw new Error(
    `Historical runtime region ${largest.id} dominates ${Math.round(maxShare * 100)}% of the total payload. Refine the region partition before world-scale expansion.`,
  );
}

console.log(`Historical runtime regions: ${rows.length}`);
console.log(`Historical runtime total payload: ${formatBytes(totalBytes)}`);
console.log(`Historical runtime average region: ${formatBytes(averageBytes)}`);
console.log(`Historical runtime largest region: ${largest.id} (${formatBytes(largest.bytes)})`);
console.log(`Historical runtime largest share: ${(maxShare * 100).toFixed(1)}%`);
for (const row of rows) {
  console.log(`  ${row.id}: ${formatBytes(row.bytes)}, ${row.provinces} provinces, ${row.geometries} geometries`);
}
