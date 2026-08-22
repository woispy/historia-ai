import assert from "node:assert/strict";
import { clearHistoricalRuntimeCache, loadHistoricalRuntimeRegions } from "../../src/world/map/loader/HistoricalRuntimeManifestLoader.js";

// The loader's region cache is intentionally exercised through the public API.
// Repeated aggregate requests must reuse the same region assets rather than
// reloading them for every viewport combination.
clearHistoricalRuntimeCache();

const first = await loadHistoricalRuntimeRegions("1300", ["anatolia"]);
assert.deepEqual(first.loadedRegions, ["anatolia"]);

const combined = await loadHistoricalRuntimeRegions("1300", ["anatolia", "balkans"]);
assert.deepEqual(combined.loadedRegions, ["anatolia", "balkans"]);

const balkansOnly = await loadHistoricalRuntimeRegions("1300", ["balkans"]);
assert.deepEqual(balkansOnly.loadedRegions, ["balkans"]);

const anatoliaAgain = await loadHistoricalRuntimeRegions("1300", ["anatolia"]);
assert.deepEqual(anatoliaAgain.loadedRegions, ["anatolia"]);

assert.notStrictEqual(first, combined);
assert.notStrictEqual(combined, balkansOnly);
assert.strictEqual(first, anatoliaAgain);

console.log("historical runtime region cache: PASS");
