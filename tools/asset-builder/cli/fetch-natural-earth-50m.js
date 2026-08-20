#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const OUTPUT_PATH = path.resolve("src/world/map/source/geometry/natural-earth/admin-0-countries.geojson");

const response = await fetch(SOURCE_URL, {
  redirect: "follow",
  headers: {
    "user-agent": "Historia-AI/physical-map-builder",
  },
});

if (!response.ok) {
  throw new Error(`Natural Earth 50m download failed: HTTP ${response.status}`);
}

const source = await response.text();
if (!source.includes("ne_50m_admin_0_countries")) {
  throw new Error("Natural Earth 50m download failed validation: unexpected dataset name.");
}

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, source, "utf8");

console.log(`Downloaded Natural Earth 50m Admin-0 countries to ${OUTPUT_PATH}.`);
