import assert from "node:assert/strict";
import { createTerrainDrawPlan } from "./TerrainDrawPlan.js";

const plan = createTerrainDrawPlan({ tile: { id: "3/10/20" }, lod: 3, adjacency: {
  north: { lod: 2, resident: true }, east: { lod: 3, resident: true }, south: { lod: 4, resident: true }, west: null,
} });
assert.equal(plan.draw, true);
assert.equal(plan.edges.north.mode, "neighbor-finer");
assert.equal(plan.edges.east.mode, "same");
assert.equal(plan.edges.south.mode, "neighbor-coarser");
assert.equal(plan.edges.west.mode, "boundary");
const deferred = createTerrainDrawPlan({ tile: { id: "3/10/21" }, lod: 3, resident: false, adjacency: {} });
assert.equal(deferred.draw, false); assert.equal(deferred.deferUntilResident, true);
assert.throws(() => createTerrainDrawPlan({ tile: { id: "3/10/22" }, lod: 3, adjacency: { north: { lod: 1 } } }), /exceeds one level/);
console.log("Phase E terrain draw plan: PASS");
