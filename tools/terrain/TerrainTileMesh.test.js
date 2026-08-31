import assert from "node:assert/strict";
import { buildTerrainIndexBuffer } from "./TerrainTileMesh.js";

const tile = { tileSize: 5, lod: 1 };
const same = buildTerrainIndexBuffer({ tile, neighbors: { north: { tileSize: 5, lod: 1 }, east: { tileSize: 5, lod: 1 }, south: { tileSize: 5, lod: 1 }, west: { tileSize: 5, lod: 1 } } });
assert.equal(same.vertexCount, 25);
assert.equal(same.indexCount, 96);
assert.equal(same.indices.length % 3, 0);
const coarse = buildTerrainIndexBuffer({ tile, neighbors: { north: { tileSize: 5, lod: 2 }, east: { tileSize: 5, lod: 1 }, south: { tileSize: 5, lod: 1 }, west: { tileSize: 5, lod: 2 } } });
assert.equal(coarse.seam.north, "neighbor-coarser");
assert.equal(coarse.seam.west, "neighbor-coarser");
assert.equal(coarse.indices.length % 3, 0);
assert.ok(coarse.indexCount < same.indexCount);
assert.throws(() => buildTerrainIndexBuffer({ tile, neighbors: { north: { tileSize: 5, lod: 3 } } }), /cannot skip/);
console.log("Phase E terrain index topology: PASS");
