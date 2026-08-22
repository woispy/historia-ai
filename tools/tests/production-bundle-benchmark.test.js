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

function normalizeAssetReference(value) {
  return value.replace(/^\.\//, "").replace(/\\/g, "/");
}

async function findInitialJsFiles(distFiles, htmlFiles) {
  const references = new Set();

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    for (const match of html.matchAll(/(?:<script[^>]+src|<link[^>]+href)=["']([^"']+\.js)["']/g)) {
      references.add(normalizeAssetReference(match[1]));
    }
  }

  return distFiles.filter((file) => {
    if (!file.endsWith(".js")) return false;
    const relative = normalizeAssetReference(path.relative(DIST_ROOT, file));
    return references.has(relative) || references.has(path.basename(relative));
  });
}

try {
  const distFiles = await walk(DIST_ROOT);
  const jsFiles = distFiles.filter((file) => file.endsWith(".js"));
  const cssFiles = distFiles.filter((file) => file.endsWith(".css"));
  const htmlFiles = distFiles.filter((file) => file.endsWith(".html"));
  const hydrographyFiles = distFiles.filter((file) => file.startsWith(`${HYDROGRAPHY_ROOT}${path.sep}`));

  const initialJsFiles = await findInitialJsFiles(distFiles, htmlFiles);
  const initialJsSet = new Set(initialJsFiles);
  const lazyJsFiles = jsFiles.filter((file) => !initialJsSet.has(file));

  const jsBytes = await bytesOf(jsFiles);
  const initialJsBytes = await bytesOf(initialJsFiles);
  const lazyJsBytes = await bytesOf(lazyJsFiles);
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

  if (initialJsFiles.length === 0) {
    throw new Error("Could not identify the initial JavaScript entry from the production HTML.");
  }

  console.log(`Production dist: ${formatBytes(distBytes)}`);
  console.log(`JavaScript total: ${formatBytes(jsBytes)}`);
  console.log(`Initial JavaScript: ${formatBytes(initialJsBytes)}`);
  console.log(`Lazy JavaScript: ${formatBytes(lazyJsBytes)}`);
  console.log(`Initial JS files: ${initialJsFiles.length}`);
  console.log(`Lazy JS files: ${lazyJsFiles.length}`);
  console.log(`CSS: ${formatBytes(cssBytes)}`);
  console.log(`HTML: ${formatBytes(htmlBytes)}`);
  console.log(`Hydrography regional payload: ${formatBytes(hydrographyBytes)}`);
  console.log(`Hydrography regions: ${regionFiles.length}`);
  console.log(`Monolithic hydrography in JS: ${monolithicReference ? "YES" : "NO"}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
