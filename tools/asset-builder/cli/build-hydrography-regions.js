#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = path.resolve("src/map/data/generated/anatolia-hydrography-10m.json");
const OUTPUT_ROOT = path.resolve("public/assets/hydrography-regions");
const MIN_LON = 24;
const MIN_LAT = 34;
const MAX_LON = 45.2;
const MAX_LAT = 43.2;
const TILE_WIDTH = 5;
const TILE_HEIGHT = 5;

function intersects(featureBounds, bounds) {
  return featureBounds[0] <= bounds[2]
    && featureBounds[2] >= bounds[0]
    && featureBounds[1] <= bounds[3]
    && featureBounds[3] >= bounds[1];
}

function tileId(x, y) {
  return `tile-${String(y).padStart(2, "0")}-${String(x).padStart(2, "0")}`;
}

function buildTiles() {
  const tiles = [];
  let y = 0;
  for (let minLat = MIN_LAT; minLat < MAX_LAT; minLat += TILE_HEIGHT, y += 1) {
    let x = 0;
    for (let minLon = MIN_LON; minLon < MAX_LON; minLon += TILE_WIDTH, x += 1) {
      tiles.push({
        id: tileId(x, y),
        bounds: [
          minLon,
          minLat,
          Math.min(minLon + TILE_WIDTH, MAX_LON),
          Math.min(minLat + TILE_HEIGHT, MAX_LAT),
        ],
        rivers: [],
        lakes: [],
      });
    }
  }
  return tiles;
}

const source = JSON.parse(await readFile(SOURCE, "utf8"));
if (!Array.isArray(source.rivers) || !Array.isArray(source.lakes)) {
  throw new Error("Invalid authoritative hydrography asset: expected rivers and lakes arrays.");
}

const tiles = buildTiles();
for (const tile of tiles) {
  for (const river of source.rivers) {
    if (intersects(river.bounds, tile.bounds)) tile.rivers.push(river);
  }
  for (const lake of source.lakes) {
    if (intersects(lake.bounds, tile.bounds)) tile.lakes.push(lake);
  }
  tile.rivers.sort((a, b) => a.id.localeCompare(b.id));
  tile.lakes.sort((a, b) => a.id.localeCompare(b.id));
}

await mkdir(OUTPUT_ROOT, { recursive: true });
for (const tile of tiles) {
  const payload = {
    version: 1,
    id: tile.id,
    projection: source.projection,
    bounds: tile.bounds,
    rivers: tile.rivers,
    lakes: tile.lakes,
  };
  await writeFile(path.join(OUTPUT_ROOT, `${tile.id}.json`), `${JSON.stringify(payload)}\n`, "utf8");
}

const manifest = {
  version: 1,
  source: source.source,
  projection: source.projection,
  bounds: [MIN_LON, MIN_LAT, MAX_LON, MAX_LAT],
  tileSize: [TILE_WIDTH, TILE_HEIGHT],
  regions: tiles.map((tile) => ({
    id: tile.id,
    bounds: tile.bounds,
    asset: `/assets/hydrography-regions/${tile.id}.json`,
    riverCount: tile.rivers.length,
    lakeCount: tile.lakes.length,
  })),
};
await writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Built ${tiles.length} hydrography regions from ${source.rivers.length} rivers and ${source.lakes.length} lakes.`);
