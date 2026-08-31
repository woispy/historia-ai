import assert from "node:assert/strict";
import { buildTerrainSplatWeights } from "./TerrainSplatWeights.js";

const result = buildTerrainSplatWeights({ landCover: ["desert", "forest", "steppe", "rock", "snow"], width: 5, height: 1 });
assert.deepEqual(Array.from(result.rgba), [255,0,0,0, 0,255,0,0, 0,0,255,0, 0,0,0,255, 0,0,0,0]);
assert.deepEqual(Array.from(result.snow), [0,0,0,0,255]);
assert.throws(() => buildTerrainSplatWeights({ landCover: ["unknown"], width: 1, height: 1 }), /Unsupported land-cover/);
assert.throws(() => buildTerrainSplatWeights({ landCover: [], width: 0, height: 1 }), /invalid/);
console.log("Phase E terrain splat weights: PASS");
