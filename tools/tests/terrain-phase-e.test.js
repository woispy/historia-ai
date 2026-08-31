import assert from "node:assert/strict";
import { TERRAIN_LODS, terrainLodForDistance } from "../../src/map/rendering/terrain/TerrainLod.js";
import { makeTerrainTileKey, terrainTileBounds, terrainTilesForBounds } from "../../src/map/rendering/terrain/TerrainTile.js";
import { planTerrainStreaming, terrainTileZoomForLod } from "../../src/map/rendering/terrain/TerrainStreaming.js";
import { normalizeSplatWeights } from "../../src/map/rendering/terrain/TerrainMaterial.js";
import { buildTerrainGridMesh } from "../../src/map/rendering/terrain/TerrainGeometry.js";
import { buildTerrainEdgeSignature, clipTerrainSampleToLand } from "../../src/map/rendering/terrain/TerrainTopology.js";
import { createTerrainTileManifest, validateTerrainTileManifest } from "../../src/map/rendering/terrain/TerrainTileManifest.js";

assert.deepEqual(TERRAIN_LODS.map((lod) => lod.level), [0, 1, 2, 3, 4]);
assert.equal(terrainLodForDistance(300), 0);
assert.equal(terrainLodForDistance(100), 1);
assert.equal(terrainLodForDistance(40), 2);
assert.equal(terrainLodForDistance(12), 3);
assert.equal(terrainLodForDistance(2), 4);

const tile = makeTerrainTileKey(2, -1, 2);
assert.equal(tile.id, "2/3/2");
assert.deepEqual(terrainTileBounds(tile), { minX: 90, minY: 0, maxX: 180, maxY: 45 });
assert.equal(terrainTileZoomForLod(4), 5);

const tiles = terrainTilesForBounds({ minX: 20, minY: 30, maxX: 70, maxY: 55 }, 2, 0);
assert.ok(tiles.length >= 2);

const plan = planTerrainStreaming({
  viewBounds: { minX: 20, minY: 30, maxX: 70, maxY: 55 },
  cameraDistance: 40,
  maxTiles: 32,
});
assert.equal(plan.lod, 2);
assert.equal(plan.zoom, 2);
assert.ok(plan.tileCount > 0);

const splat = normalizeSplatWeights([1, 2, 3, 4, 0]);
assert.ok(Math.abs(splat.reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
assert.deepEqual(normalizeSplatWeights([0, 0, 0, 0, 0]), [0, 0, 1, 0, 0]);

const heights = Float32Array.from([0, 0.1, 0, 0.2, 0.3, 0.2, 0, 0.2, 0]);
const mesh = buildTerrainGridMesh({ heights, size: 3 });
assert.equal(mesh.positions.length, 27);
assert.equal(mesh.normals.length, 27);
assert.equal(mesh.indices.length, 24);
assert.ok(mesh.indices.every((index) => index < 9));

const landMask = { contains: (x, y) => x >= 0 && y >= 0 };
assert.equal(clipTerrainSampleToLand({ x: 1, y: 2, height: 3, landMask }).land, true);
assert.equal(clipTerrainSampleToLand({ x: -1, y: 2, height: 3, landMask }).land, false);
const edge = buildTerrainEdgeSignature({ tile, heights, size: 3 });
assert.equal(edge.top.length, 3);
assert.equal(edge.left.length, 3);

const manifest = createTerrainTileManifest({
  tile,
  bounds: terrainTileBounds(tile),
  assets: {
    heightmap: "terrain/2/3/2/height.r16",
    normal: "terrain/2/3/2/normal.ktx2",
    splatRgba: "terrain/2/3/2/splat-rgba.ktx2",
    splatSnow: "terrain/2/3/2/splat-snow.ktx2",
    landMask: "terrain/2/3/2/land-mask.ktx2",
  },
});
assert.equal(validateTerrainTileManifest(manifest), true);

console.log("Phase E terrain contracts: PASS");
