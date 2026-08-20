import assert from "node:assert/strict";
import { createCameraModel } from "../../../../src/map/camera/CameraModel.js";
import { moveCamera, setCameraPosition, setCameraZoom, zoomCamera } from "../../../../src/map/camera/CameraActions.js";
import { getWheelZoomDelta } from "../../../../src/map/camera/CameraZoom.js";
import { DEFAULT_SETTINGS } from "../../../../src/settings/SettingsModel.js";
import { normalizeHistoricalFeature } from "../normalize-1300.js";

const antarctica = normalizeHistoricalFeature(
  {
    type: "Feature",
    properties: { NAME: "Antarctica" },
    geometry: { type: "Polygon", coordinates: [[[-30, -90], [30, -90], [30, -60], [-30, -90]]] },
  },
  11,
  1300,
);
const antarcticaLatitudes = antarctica.polygons[0].map(([, latitude]) => latitude);
const antarcticaLatitudeSpan = Math.max(...antarcticaLatitudes) - Math.min(...antarcticaLatitudes);
assert.ok(Math.abs(antarcticaLatitudeSpan - 5.4) < 1e-9);

const viewport = { width: 1200, height: 700 };
const camera = createCameraModel();
const draggedDown = moveCamera(camera, 0, 100, viewport);
const draggedUp = moveCamera(camera, 0, -100, viewport);
assert.ok(draggedDown.y > camera.y, "Dragging down must move the map south/down.");
assert.ok(draggedUp.y < camera.y, "Dragging up must move the map north/up.");
assert.equal(setCameraZoom(camera, 150, viewport).zoom, 48);
assert.equal(setCameraZoom(camera, 0, viewport).zoom, 1);
assert.equal(setCameraPosition(camera, 180, 0, viewport).x, 0);
assert.equal(setCameraPosition(setCameraZoom(camera, 2, viewport), 180, 0, viewport).x, 90);

const lowWheelDelta = getWheelZoomDelta({ deltaY: -100, deltaMode: 0 }, 4);
const highWheelDelta = getWheelZoomDelta({ deltaY: -100, deltaMode: 0 }, 60);
assert.ok(lowWheelDelta > 0);
assert.ok(highWheelDelta > lowWheelDelta);
assert.ok(Math.abs(highWheelDelta / lowWheelDelta - 15) < 1e-9);

const lowZoom = setCameraZoom(camera, 4, viewport);
const highZoom = setCameraZoom(camera, 40, viewport);
assert.equal(zoomCamera(lowZoom, 1.5, viewport).zoom - lowZoom.zoom, 1.5);
assert.equal(zoomCamera(highZoom, 1.5, viewport).zoom - highZoom.zoom, 1.5);
assert.equal(zoomCamera(highZoom, -1.5, viewport).zoom - highZoom.zoom, -1.5);

assert.equal(DEFAULT_SETTINGS.advisorAutoOpen, undefined);
