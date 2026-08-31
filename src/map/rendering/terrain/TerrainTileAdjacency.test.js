import assert from "node:assert/strict";
import { buildTerrainAdjacency, planTerrainLodSeams } from "./TerrainTileAdjacency.js";

const center = { zoom: 3, x: 10, y: 20 };
const lookup = new Map([
  ["3/10/19", { id: "north", lod: 2 }],
  ["3/11/20", { id: "east", lod: 3 }],
  ["3/10/21", { id: "south", lod: 4 }],
  ["3/9/20", { id: "west", lod: 3 }],
]);
const adjacency = buildTerrainAdjacency(center, lookup);
assert.equal(adjacency.north.id, "north"); assert.equal(adjacency.east.id, "east"); assert.equal(adjacency.south.id, "south"); assert.equal(adjacency.west.id, "west");
const plan = planTerrainLodSeams(3, adjacency);
assert.equal(plan.north.transition, "neighbor-finer"); assert.equal(plan.east.transition, "same"); assert.equal(plan.south.transition, "neighbor-coarser");

const coarseLookup = new Map([["2/5/9", { id: "coarse-north", lod: 2 }]]);
const coarseAdjacency = buildTerrainAdjacency(center, coarseLookup);
assert.equal(coarseAdjacency.north.id, "coarse-north");
assert.equal(planTerrainLodSeams(3, coarseAdjacency).north.transition, "neighbor-finer");

const fineLookup = new Map([
  ["4/20/39", { id: "fine-north-west", lod: 4 }],
  ["4/21/39", { id: "fine-north-east", lod: 4 }],
]);
const fineAdjacency = buildTerrainAdjacency(center, fineLookup);
assert.equal(fineAdjacency.north.id, "fine-north-west");
assert.deepEqual(fineAdjacency.north.coverage, ["fine-north-west", "fine-north-east"]);
assert.equal(planTerrainLodSeams(3, fineAdjacency).north.transition, "neighbor-coarser");

assert.throws(() => planTerrainLodSeams(3, { north: { lod: 1 } }), /exceeds one level/);
console.log("Phase E terrain tile adjacency: PASS");
