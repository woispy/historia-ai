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
import { MapCameraRig } from "../../src/map/runtime/MapCameraRig.js";
import { BinaryMapRenderer } from "../../src/map/rendering/gpu/BinaryMapRenderer.js";
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

test("periodic render selection remains bounded during deep unwrapped traversal", () => {
  assert.deepEqual(getVisibleWorldCopyOffsets(540, 1), [360, 720]);
  assert.deepEqual(getVisibleWorldCopyOffsets(900, 1), [720, 1080]);
  assert.deepEqual(getVisibleWorldCopyOffsets(1260, 1), [1080, 1440]);
});

test("render longitude canonicalization preserves the same physical point", () => {
  assert.equal(worldToCanonicalLongitude(-180), -180);
  assert.equal(worldToCanonicalLongitude(180), -180);
  assert.equal(worldToCanonicalLongitude(540), -180);
  assert.equal(worldToCanonicalLongitude(541), -179);
});

test("legacy camera actions remain canonical for data-facing camera state", () => {
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

test("production camera rig keeps render longitude unwrapped across the antimeridian", () => {
  const rig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  rig.setState({ x: 179 });
  rig.panPixels(-8, 0, 1280, 720);

  const crossedEast = rig.snapshot();
  assert.equal(crossedEast.renderX, 181.25);
  assert.equal(crossedEast.x, -178.75);

  rig.setState({ x: -179 });
  rig.panPixels(8, 0, 1280, 720);

  const crossedWest = rig.snapshot();
  assert.equal(crossedWest.renderX, -181.25);
  assert.equal(crossedWest.x, 178.75);
});

test("production camera rig can traverse 360, 720, and 1080 degrees without render jumps", () => {
  const rig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  rig.setState({ x: 179 });
  rig.panPixels(-180, 0, 360, 720);
  const oneWorld = rig.snapshot();
  assert.equal(oneWorld.renderX, 539);
  assert.equal(oneWorld.x, 179);

  rig.panPixels(-180, 0, 360, 720);
  const twoWorlds = rig.snapshot();
  assert.equal(twoWorlds.renderX, 899);
  assert.equal(twoWorlds.x, 179);

  rig.panPixels(-180, 0, 360, 720);
  const threeWorlds = rig.snapshot();
  assert.equal(threeWorlds.renderX, 1259);
  assert.equal(threeWorlds.x, 179);
  assert.equal(threeWorlds.renderX - oneWorld.renderX, 720);
  assert.equal(threeWorlds.renderX - 179, 1080);
});

test("camera rig tick advances inertia using unwrapped render longitude", () => {
  const rig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  rig.setState({ x: 179 });
  rig.panPixels(-8, 0, 1280, 720);
  const beforeTick = rig.snapshot();
  const afterTick = rig.tick(1 / 60);

  assert.ok(afterTick.renderX > beforeTick.renderX);
  assert.ok(afterTick.x >= WORLD_MIN_X && afterTick.x < WORLD_MAX_X);
  assert.equal(afterTick.x, normalizeLongitude(afterTick.renderX));
});

test("renderer treats renderX as its internal render-space camera coordinate", () => {
  const renderer = new BinaryMapRenderer({});
  renderer.setCamera({ x: -179, renderX: 181, zoom: 4 });

  assert.equal(renderer.camera.x, 181);
  assert.equal(renderer.camera.renderX, 181);
  assert.equal(renderer.camera.zoom, 4);
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
