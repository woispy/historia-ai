import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const layer = await read(new URL("../../src/map/components/layers/HistoricalRuntimeViewportLayer.jsx", import.meta.url));
const worldMap = await read(new URL("../../src/map/components/WorldMap.jsx", import.meta.url));
const viewport = await read(new URL("../../src/map/camera/CameraViewport.jsx", import.meta.url));

assert.match(layer, /getVisibleWorldBounds/);
assert.match(layer, /selectHistoricalRuntimeRegionsByBounds/);
assert.match(layer, /loadHistoricalRuntimeRegions/);
assert.match(layer, /requestGeneration/);
assert.match(layer, /generation !== requestGeneration\.current/);
assert.match(layer, /if \(!regionIds\.length\)/);
assert.match(layer, /clipPath=\"url\(#world-land-mask\)\"/);
assert.match(layer, /fill=\{entry\.historicalPolitical\?\.color/);

assert.match(worldMap, /isHistoricalPoliticalMap/);
assert.match(worldMap, /<HistoricalPoliticalRegionLayer/);
assert.match(worldMap, /<HistoricalRuntimeViewportLayer/);
assert.match(worldMap, /isHistoricalPoliticalMap \? null/);
assert.match(worldMap, /isHistoricalPoliticalMap && viewport\.width > 0 && viewport\.height > 0/);
assert.match(worldMap, /renderFill=\{!isHistoricalPoliticalMap\}/);

assert.match(viewport, /ResizeObserver/);
assert.match(viewport, /onViewportSizeChange/);

console.log("historical-runtime-viewport-layer.test.js: camera-driven selection, stale-request guard, viewport sizing, and land-clipping contract passed");

async function read(url) {
  return (await readFile(url, "utf8")).replace(/\r\n/g, "\n");
}
