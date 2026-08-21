#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCES = [
  {
    key: "lakes",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson",
    marker: "ne_10m_lakes",
    output: "src/world/map/source/physical/ne_10m_lakes.geojson",
  },
  {
    key: "rivers",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson",
    marker: "ne_10m_rivers_lake_centerlines",
    output: "src/world/map/source/physical/ne_10m_rivers_lake_centerlines.geojson",
  },
];

for (const source of SOURCES) {
  const response = await fetch(source.url, {
    redirect: "follow",
    headers: { "user-agent": "Historia-AI/physical-map-builder" },
  });

  if (!response.ok) {
    throw new Error(`Natural Earth 10m ${source.key} download failed: HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text.includes(source.marker)) {
    throw new Error(`Natural Earth 10m ${source.key} download failed validation: unexpected dataset.`);
  }

  const outputPath = path.resolve(source.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, text, "utf8");
  console.log(`Downloaded Natural Earth 10m ${source.key} to ${outputPath}.`);
}
