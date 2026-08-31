import assert from "node:assert/strict";
import { TerrainGpuResidency } from "./TerrainGpuResidency.js";

const cache = new TerrainGpuResidency({ maxBytes: 100, maxTiles: 2 });
cache.request("a", 40, 10); cache.request("b", 40, 1); cache.beginLoad("a"); cache.beginLoad("b"); cache.markResident("a"); cache.markResident("b"); assert.equal(cache.snapshot().usedBytes, 80); cache.touch("a");
cache.request("c", 40, 0); cache.beginLoad("c"); cache.markResident("c"); assert.equal(cache.get("b").state, "evicting"); assert.equal(cache.snapshot().residentTiles, 2); assert.equal(cache.finishEviction("b"), true); assert.equal(cache.snapshot().usedBytes, 80);
assert.deepEqual(cache.evictUnretained(new Set(["a", "c"])), []); assert.deepEqual(cache.evictUnretained(new Set(["a"])), ["c"]); assert.equal(cache.finishEviction("c"), true); assert.equal(cache.snapshot().usedBytes, 40);
assert.throws(() => cache.request("x", -1), /non-negative/); assert.throws(() => cache.markResident("missing"), /Unknown/); assert.throws(() => cache.request("c"), /pending GPU eviction/);
console.log("Phase E terrain GPU residency: PASS");
