import assert from "node:assert/strict";
import { createTerrainGpuResidency } from "./TerrainGpuResidency.js";

const cache = createTerrainGpuResidency({ maxResidentTiles: 2 });
cache.request("a", 1); cache.beginLoading("a"); cache.markResident("a", 1);
cache.request("b", 2); cache.beginLoading("b"); cache.markResident("b", 2);
cache.request("c", 3); cache.beginLoading("c"); cache.markResident("c", 3);
const snapshot = cache.snapshot();
assert.equal(snapshot.filter((r) => r.state === "resident").length, 2);
assert.equal(snapshot.find((r) => r.id === "a").state, "evicting");
cache.finishEviction("a");
assert.equal(cache.snapshot().some((r) => r.id === "a"), false);
assert.throws(() => cache.markResident("b"), /Invalid terrain GPU residency transition/);
assert.throws(() => cache.beginLoading("missing"), /not requested/);
console.log("Phase E GPU terrain residency: PASS");
