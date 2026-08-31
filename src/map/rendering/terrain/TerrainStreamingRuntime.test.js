import assert from "node:assert/strict";
import { TerrainGpuResidency } from "./TerrainGpuResidency.js";
import { createTerrainStreamingController } from "./TerrainStreamingController.js";
import { TerrainStreamingRuntime } from "./TerrainStreamingRuntime.js";

const residency = new TerrainGpuResidency({ maxBytes: 1024 * 1024, maxTiles: 32 });
const requested = [];
const controller = createTerrainStreamingController({ residency, maxTiles: 4, requestTile: (tile, lod) => requested.push({ tile, lod }) });
const uploads = [];
const runtime = new TerrainStreamingRuntime({ controller, residency, loader: async (id) => ({ mesh: { id } }), upload: async (id, asset) => uploads.push([id, asset.mesh.id]) });
const plan = runtime.update({ viewBounds: { minX: 20, minY: 30, maxX: 70, maxY: 55 }, cameraDistance: 40 });
assert.equal(plan.requested.length, requested.length); await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(uploads.length, requested.length);
for (const item of requested) assert.equal(residency.get(item.tile.id).state, "resident");
console.log("Phase E terrain streaming runtime: PASS");
