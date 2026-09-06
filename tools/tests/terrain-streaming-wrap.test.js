import assert from "node:assert/strict";
import { planTerrainStreaming } from "../../src/map/rendering/terrain/TerrainStreaming.js";

const antimeridian = planTerrainStreaming({
  viewBounds: { minX: 170, minY: 20, maxX: 190, maxY: 40 },
  cameraDistance: 40,
  maxTiles: 32,
});
assert.equal(antimeridian.lod, 2);
assert.equal(antimeridian.zoom, 2);
assert.ok(antimeridian.tiles.some((tile) => tile.id.startsWith("2/3/")));
assert.ok(antimeridian.tiles.some((tile) => tile.id.startsWith("2/0/")));
assert.equal(new Set(antimeridian.tiles.map((tile) => tile.id)).size, antimeridian.tileCount);

const unwrapped = planTerrainStreaming({
  viewBounds: { minX: 530, minY: 20, maxX: 550, maxY: 40 },
  cameraDistance: 40,
  maxTiles: 32,
});
assert.equal(unwrapped.lod, 2);
assert.deepEqual(unwrapped.tiles.map((tile) => tile.id), antimeridian.tiles.map((tile) => tile.id));

assert.throws(
  () => planTerrainStreaming({ viewBounds: { minX: 0, minY: 0, maxX: 180, maxY: 90 }, cameraDistance: 2, maxTiles: 1 }),
  /exceeds tile budget/,
);

console.log("Terrain streaming antimeridian + unwrapped-world regression: PASS");
