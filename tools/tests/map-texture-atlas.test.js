import assert from "node:assert/strict";
import {
  getTextureDimensions,
  normalizeLongitude,
  worldToTexturePoint,
  hexToRgb,
  MAP_TEXTURE_ATLAS,
} from "../../src/map/rendering/gpu/MapTextureAtlas.js";
import { getWheelZoomDelta, getWheelZoomFactor } from "../../src/map/camera/CameraZoom.js";
import { getGeometryBounds, getViewportBounds, isGeometryVisible } from "../../src/map/rendering/MapViewportCulling.js";

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

const zoomIn = { deltaY: -100, deltaMode: 0 };
const zoomOut = { deltaY: 100, deltaMode: 0 };
assert.ok(getWheelZoomFactor(zoomIn) > 1);
assert.ok(getWheelZoomFactor(zoomOut) < 1);
assert.equal(
  Number((getWheelZoomDelta(zoomIn, 8) / 8).toFixed(8)),
  Number(getWheelZoomDelta(zoomIn, 1).toFixed(8)),
);

const geometry = getGeometryBounds({
  polygons: [[[26, 36], [45, 36], [45, 42], [26, 42]]],
});
assert.deepEqual(geometry, { minX: 26, minY: 36, maxX: 45, maxY: 42 });
assert.equal(isGeometryVisible(geometry, getViewportBounds({ x: 35, y: 39, zoom: 8 }, 0)), true);
assert.equal(isGeometryVisible(geometry, getViewportBounds({ x: -100, y: 60, zoom: 8 }, 0)), false);

console.log("Map texture atlas tests passed: dimensions, wrapping, projection, color encoding, zoom and viewport culling.");
