import assert from "node:assert/strict";
import { TerrainGpuResidency } from "./TerrainGpuResidency.js";
import { createTerrainStreamingController } from "./TerrainStreamingController.js";

const residency = new TerrainGpuResidency({ maxBytes: 1024, maxTiles: 16 });
const requested = [];
const controller = createTerrainStreamingController({ residency, maxTiles: 16, requestTile: (tile, lod) => requested.push({ id: tile.id, lod }) });
const result = controller.update({ viewBounds: { minX: 20, minY: 30, maxX: 70, maxY: 55 }, cameraDistance: 40 });
assert.equal(result.lod, 2); assert.ok(result.tiles.length > 0); assert.equal(requested.length, result.tiles.length);
for (const item of requested) assert.equal(residency.get(item.id).state, "requested");
console.log("Phase E terrain streaming controller: PASS");
