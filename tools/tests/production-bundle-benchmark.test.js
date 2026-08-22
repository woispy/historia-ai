#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ROOT = path.resolve("dist");
const HYDROGRAPHY_ROOT = path.join(DIST_ROOT, "assets", "hydrography-regions");
const MONOLITHIC_ASSET_NAME = "anatolia-hydrography-10m.json";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(filePath));
    else files.push(filePath);
  }
  return files;
}

async function bytesOf(files) {
  let total = 0;
  for (const file of files) total += (await stat(file)).size;
  return total;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

try {
  const distFiles = await walk(DIST_ROOT);
  const jsFiles = distFiles.filter((file) => file.endsWith(".js"));
  const cssFiles = distFiles.filter((file) => file.endsWith(".css"));
  const htmlFiles = distFiles.filter((file) => file.endsWith(".html"));
  const hydrographyFiles = distFiles.filter((file) => file.startsWith(`${HYDROGRAPHY_ROOT}${path.sep}`));

  const jsBytes = await bytesOf(jsFiles);
  const cssBytes = await bytesOf(cssFiles);
  const htmlBytes = await bytesOf(htmlFiles);
  const distBytes = await bytesOf(distFiles);
  const hydrographyBytes = await bytesOf(hydrographyFiles);

  const jsContents = await Promise.all(jsFiles.map((file) => readFile(file, "utf8")));
  const monolithicReference = jsContents.some((content) => content.includes(MONOLITHIC_ASSET_NAME));

  if (monolithicReference) {
    throw new Error(`Production JS still references ${MONOLITHIC_ASSET_NAME}; hydrography must remain regional.`);
  }

  const manifest = hydrographyFiles.find((file) => path.basename(file) === "manifest.json");
  if (!manifest) throw new Error("Production build is missing hydrography-regions/manifest.json.");

  const regionFiles = hydrographyFiles.filter((file) => path.basename(file).startsWith("tile-") && file.endsWith(".json"));
  if (regionFiles.length === 0) throw new Error("Production build contains no hydrography region assets.");

  console.log(`Production dist: ${formatBytes(distBytes)}`);
  console.log(`JavaScript: ${formatBytes(jsBytes)}`);
  console.log(`CSS: ${formatBytes(cssBytes)}`);
  console.log(`HTML: ${formatBytes(htmlBytes)}`);
  console.log(`Hydrography regional payload: ${formatBytes(hydrographyBytes)}`);
  console.log(`Hydrography regions: ${regionFiles.length}`);
  console.log(`Monolithic hydrography in JS: ${monolithicReference ? "YES" : "NO"}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
