import assert from "node:assert/strict";
import { createTerrainSpatialIndex } from "./TerrainSpatialIndex.js";

const index = createTerrainSpatialIndex({ bounds: { minX: 26, minY: 36, maxX: 45, maxY: 42 }, maxLod: 4 });
const selected = index.select({ cameraX: 35, cameraY: 39, viewDistance: 2, maxTiles: 32 });
assert.ok(selected.length > 0);
assert.ok(selected.length <= 32);
assert.ok(selected.some((tile) => tile.lod === 4));
for (const tile of selected) {
  assert.ok(tile.bounds.minX >= 26 && tile.bounds.maxX <= 45);
  assert.ok(tile.bounds.minY >= 36 && tile.bounds.maxY <= 42);
}
assert.throws(() => index.select({ cameraX: 35, cameraY: 39, viewDistance: 0 }), /positive view distance/);
assert.throws(() => createTerrainSpatialIndex({ bounds: { minX: 1, minY: 1, maxX: 1, maxY: 2 } }), /Invalid spatial bounds/);
console.log("Phase E terrain spatial LOD selection: PASS");
