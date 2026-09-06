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
  getVisibleWorldCopyOffsets,
  worldToCanonicalLongitude,
} from "../../src/map/rendering/WorldWrapRender.js";
import {
  focusCamera,
  moveCamera,
  setCameraPosition,
} from "../../src/map/camera/CameraActions.js";
import { createCameraModel } from "../../src/map/camera/CameraModel.js";
import {
  getViewportBounds,
  isGeometryVisible,
} from "../../src/map/rendering/MapViewportCulling.js";

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

test("periodic render selection keeps one copy at world center", () => {
  assert.deepEqual(getVisibleWorldCopyOffsets(0, 1), [0]);
  assert.deepEqual(getVisibleWorldCopyOffsets(0, 2), [0]);
});

test("periodic render selection adds only the adjacent copy at the antimeridian", () => {
  assert.deepEqual(getVisibleWorldCopyOffsets(179, 1), [0, 360]);
  assert.deepEqual(getVisibleWorldCopyOffsets(-179, 1), [-360, 0]);
});

test("render longitude canonicalization preserves the same physical point", () => {
  assert.equal(worldToCanonicalLongitude(-180), -180);
  assert.equal(worldToCanonicalLongitude(180), -180);
  assert.equal(worldToCanonicalLongitude(540), -180);
  assert.equal(worldToCanonicalLongitude(541), -179);
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

test("viewport culling preserves geometry across the antimeridian", () => {
  const viewport = getViewportBounds({ x: 179, y: 0, zoom: 4 }, 0);
  assert.equal(isGeometryVisible({ minX: -179.5, maxX: -178.5, minY: -1, maxY: 1 }, viewport), true);
  assert.equal(isGeometryVisible({ minX: 0, maxX: 1, minY: -1, maxY: 1 }, viewport), false);
});

test("viewport culling does not reject a full-world horizontal span", () => {
  const viewport = getViewportBounds({ x: 0, y: 0, zoom: 0.5 }, 0);
  assert.ok(viewport.maxX - viewport.minX >= WORLD_WIDTH);
  assert.equal(isGeometryVisible({ minX: 0, maxX: 1, minY: -1, maxY: 1 }, viewport), true);
});
