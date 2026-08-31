import assert from "node:assert/strict";
import { evaluateTerrainMaterial } from "./TerrainMaterialModel.js";

const weights = Uint8Array.from([255,0,0,0,0, 0,0,128,127,0]);
const palette = { desert: [0.75,0.62,0.38], forest: [0.24,0.38,0.18], steppe: [0.58,0.55,0.32], rock: [0.42,0.42,0.4], snow: [0.9,0.92,0.95] };
const desert = evaluateTerrainMaterial({ weights, sampleIndex: 0, albedoByClass: palette });
assert.deepEqual(desert.albedo, palette.desert);
assert.equal(desert.roughness, 0.9);
const mixed = evaluateTerrainMaterial({ weights, sampleIndex: 1, albedoByClass: palette });
assert.ok(mixed.albedo[0] > palette.steppe[0] && mixed.albedo[0] < palette.rock[0]);
assert.ok(mixed.roughness > 0.76 && mixed.roughness < 0.88);
assert.throws(() => evaluateTerrainMaterial({ weights: Uint8Array.from([0,0,0,0]), sampleIndex: 0, albedoByClass: palette }), /five channels/);
assert.throws(() => evaluateTerrainMaterial({ weights, sampleIndex: 0, albedoByClass: {} }), /Albedo/);
console.log("Phase E terrain material model: PASS");
