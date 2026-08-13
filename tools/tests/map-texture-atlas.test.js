import assert from "node:assert/strict";
import { getTextureDimensions, normalizeLongitude, worldToTexturePoint, hexToRgb, MAP_TEXTURE_ATLAS } from "../../src/map/rendering/gpu/MapTextureAtlas.js";

assert.deepEqual(getTextureDimensions(4096), { width: 4096, height: 2048 });
assert.deepEqual(getTextureDimensions(2048), { width: 2048, height: 1024 });
assert.equal(normalizeLongitude(540), 180);
assert.equal(normalizeLongitude(-540), -180);
assert.deepEqual(worldToTexturePoint([-180, 90], 4096, 2048), [0, 0]);
assert.deepEqual(worldToTexturePoint([180, -90], 4096, 2048), [4096, 2048]);
assert.deepEqual(hexToRgb("#123456"), [18, 52, 86]);
assert.deepEqual(hexToRgb("bad"), [111, 118, 95]);
assert.equal(MAP_TEXTURE_ATLAS.WORLD_WIDTH, 360);
assert.equal(MAP_TEXTURE_ATLAS.WORLD_HEIGHT, 180);
console.log("Map texture atlas tests passed: dimensions, wrapping, projection and color encoding.");
