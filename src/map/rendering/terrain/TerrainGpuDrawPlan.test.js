import assert from "node:assert/strict";
import { createGpuTerrainDrawPlan } from "./TerrainGpuDrawPlan.js";

const plan = createGpuTerrainDrawPlan({ baseIndexCount: 384, seamIndexCounts: { "neighbor-finer": 36, "neighbor-coarser": 36, boundary: 12 }, edges: { north: { mode: "neighbor-finer" }, east: { mode: "same" }, south: { mode: "neighbor-coarser" }, west: { mode: "boundary" } } });
assert.equal(plan.draw, true);
assert.deepEqual(plan.passes.map((pass) => pass.mode), ["base", "neighbor-finer", "neighbor-coarser", "boundary"]);
assert.equal(plan.indexCount, 468);
const deferred = createGpuTerrainDrawPlan({ baseIndexCount: 384, resident: false });
assert.equal(deferred.draw, false); assert.equal(deferred.indexCount, 0); assert.deepEqual(deferred.passes, []);
assert.throws(() => createGpuTerrainDrawPlan({ baseIndexCount: 1, edges: { north: { mode: "invalid" } } }), /Unknown terrain seam mode/);
console.log("Phase E GPU terrain draw plan: PASS");
