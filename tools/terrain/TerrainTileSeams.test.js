import assert from "node:assert/strict";
import { buildEdgeStitchPattern, classifyNeighborLod, getEdgeSamples, validateTileNeighbors, TERRAIN_EDGE } from "./TerrainTileSeams.js";

const tile = { tileSize: 5, lod: 1, heights: Float32Array.from([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]) };
assert.deepEqual(getEdgeSamples(tile, TERRAIN_EDGE.NORTH), [0,1,2,3,4]);
assert.deepEqual(getEdgeSamples(tile, TERRAIN_EDGE.SOUTH), [20,21,22,23,24]);
assert.deepEqual(getEdgeSamples(tile, TERRAIN_EDGE.WEST), [0,5,10,15,20]);
assert.equal(classifyNeighborLod(1, 1), "same");
assert.equal(classifyNeighborLod(1, 2), "neighbor-coarser");
assert.equal(classifyNeighborLod(1, 0), "neighbor-finer");
assert.throws(() => classifyNeighborLod(1, 3), /cannot skip/);
const pattern = buildEdgeStitchPattern({ tile, edge: TERRAIN_EDGE.EAST, neighborLod: 2 });
assert.equal(pattern.relation, "neighbor-coarser");
assert.equal(pattern.indices.length, 2);
assert.deepEqual(validateTileNeighbors({ tile, neighbors: { north: { tileSize: 5, lod: 1 }, east: { tileSize: 5, lod: 2 }, south: null, west: { tileSize: 5, lod: 0 } } }), { north: "same", east: "neighbor-coarser", south: "boundary", west: "neighbor-finer" });
console.log("Phase E terrain seam topology: PASS");
