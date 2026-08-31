import assert from "node:assert/strict";
import { createTerrainStreamingScheduler } from "./TerrainStreamingScheduler.js";

const scheduler = createTerrainStreamingScheduler({ maxLoadsPerFrame: 2, maxUploadsPerFrame: 1 });
assert.equal(scheduler.enqueue({ id: "far" }, { priority: 1, frame: 0 }), true);
assert.equal(scheduler.enqueue({ id: "near" }, { priority: 10, frame: 0 }), true);
assert.equal(scheduler.enqueue({ id: "medium" }, { priority: 5, frame: 1 }), true);
assert.equal(scheduler.enqueue({ id: "near" }, { priority: 20, frame: 2 }), false);
const load = scheduler.beginFrame(2);
assert.deepEqual(load.map((tile) => tile.id), ["near", "medium"]);
scheduler.markLoaded("near", { gpuBytes: 1024 });
scheduler.markLoaded("medium", { gpuBytes: 1024 });
assert.equal(scheduler.consumeUploads().length, 1);
assert.deepEqual(scheduler.snapshot(), { queued: 1, loading: 0, resident: 2 });
scheduler.evict("medium");
assert.deepEqual(scheduler.snapshot(), { queued: 1, loading: 0, resident: 1 });
assert.throws(() => scheduler.markLoaded("missing", {}), /not loading/);
console.log("Phase E terrain streaming scheduler: PASS");
