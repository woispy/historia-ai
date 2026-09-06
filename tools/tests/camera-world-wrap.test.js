import assert from "node:assert/strict";
import test from "node:test";
import {
  getNearestWorldCopyOffset,
  getWorldCopyIndex,
  getWorldCopyOffset,
  normalizeLongitude,
  WORLD_MAX_X,
  WORLD_MIN_X,
  WORLD_WIDTH,
} from "../../src/map/camera/WorldWrap.js";
import {
  focusCamera,
  moveCamera,
  setCameraPosition,
} from "../../src/map/camera/CameraActions.js";
import { createCameraModel } from "../../src/map/camera/CameraModel.js";

test("canonical longitude stays in [-180, 180)", () => {
  assert.equal(normalizeLongitude(WORLD_MIN_X), WORLD_MIN_X);
  assert.equal(normalizeLongitude(WORLD_MAX_X), WORLD_MIN_X);
  assert.equal(normalizeLongitude(540), WORLD_MIN_X);
  assert.equal(normalizeLongitude(-540), WORLD_MIN_X);
  assert.equal(normalizeLongitude(181), -179);
  assert.equal(normalizeLongitude(-181), 179);
});

test("world copy offsets are exact multiples of one world width", () => {
  assert.equal(WORLD_WIDTH, 360);
  assert.equal(getWorldCopyIndex(-180), 0);
  assert.equal(getWorldCopyIndex(180), 1);
  assert.equal(getWorldCopyIndex(540), 2);
  assert.equal(getWorldCopyOffset(-2), -720);
  assert.equal(getWorldCopyOffset(1), 360);
  assert.equal(getNearestWorldCopyOffset(179, -179), -360);
  assert.equal(getNearestWorldCopyOffset(-179, 179), 360);
});

test("camera movement wraps horizontally without weakening vertical bounds", () => {
  const camera = createCameraModel();
  const viewport = { width: 1920, height: 1080 };
  const movedRight = moveCamera({ ...camera, x: 179.5 }, 20, 0, viewport);
  const movedLeft = moveCamera({ ...camera, x: -179.5 }, -20, 0, viewport);

  assert.ok(movedRight.x < WORLD_MAX_X);
  assert.ok(movedRight.x >= WORLD_MIN_X);
  assert.ok(movedLeft.x < WORLD_MAX_X);
  assert.ok(movedLeft.x >= WORLD_MIN_X);

  const verticallyMoved = moveCamera(camera, 0, 100000, viewport);
  assert.ok(verticallyMoved.y <= 90);
});

test("position and focus use the same canonical longitude rule", () => {
  const camera = createCameraModel();
  const positioned = setCameraPosition(camera, 540, 0);
  const focused = focusCamera(camera, -541, 0, "province-a");

  assert.equal(positioned.x, -180);
  assert.equal(focused.x, 179);
  assert.equal(focused.target, "province-a");
});
