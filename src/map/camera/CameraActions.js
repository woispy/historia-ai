/**
 * ============================================================================
 * Historia AI
 * Camera Actions
 * ============================================================================
 */

import {
  createCameraModel,
} from "./CameraModel";

const WORLD_WIDTH = 360;
const WORLD_HEIGHT = 180;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWrap(value, period) {
  if (!Number.isFinite(period) || period <= 0) {
    return value;
  }

  return (
    ((value + period / 2) % period + period) % period
    - period / 2
  );
}

function getWorldScreenSize(viewport, zoom) {
  const width = Math.max(1, Number(viewport?.width ?? 1));
  const height = Math.max(1, Number(viewport?.height ?? 1));
  const fitScale = Math.min(
    width / WORLD_WIDTH,
    height / WORLD_HEIGHT
  );

  return {
    width: WORLD_WIDTH * fitScale * zoom,
    height: WORLD_HEIGHT * fitScale * zoom,
  };
}

function constrainPosition(camera, x, y, viewport) {
  if (!viewport?.width || !viewport?.height) {
    return { x, y };
  }

  const world = getWorldScreenSize(
    viewport,
    camera.zoom
  );

  const verticalRange = Math.max(
    0,
    (world.height - viewport.height) / 2
  );

  return {
    // The horizontal axis is a cylinder: keep the camera in one wrapped
    // period while the renderer displays neighbouring world copies.
    x: normalizeWrap(x, world.width),
    // The poles are not wrapped; keep vertical movement inside the world.
    y: clamp(y, -verticalRange, verticalRange),
  };
}

/**
 * Moves the camera in screen space.
 */
export function moveCamera(
  camera,
  dx,
  dy,
  viewport
) {
  const position = constrainPosition(
    camera,
    camera.x + dx,
    camera.y + dy,
    viewport
  );

  return {
    ...camera,
    ...position,
  };
}

/**
 * Changes camera zoom while preserving the current wrapped position.
 */
export function zoomCamera(
  camera,
  delta,
  viewport
) {
  const zoom = clamp(
    camera.zoom + delta,
    camera.minZoom,
    camera.maxZoom
  );

  const nextCamera = {
    ...camera,
    zoom,
  };

  return {
    ...nextCamera,
    ...constrainPosition(
      nextCamera,
      nextCamera.x,
      nextCamera.y,
      viewport
    ),
  };
}

/**
 * Sets an absolute zoom level.
 */
export function setCameraZoom(
  camera,
  zoom,
  viewport
) {
  const nextCamera = {
    ...camera,
    zoom: clamp(
      zoom,
      camera.minZoom,
      camera.maxZoom
    ),
  };

  return {
    ...nextCamera,
    ...constrainPosition(
      nextCamera,
      nextCamera.x,
      nextCamera.y,
      viewport
    ),
  };
}

/**
 * Sets the current world position.
 */
export function setCameraPosition(
  camera,
  x,
  y,
  viewport
) {
  return {
    ...camera,
    ...constrainPosition(
      camera,
      x,
      y,
      viewport
    ),
  };
}

/**
 * Focuses the camera on a world position.
 */
export function focusCamera(
  camera,
  x,
  y,
  target = null,
  viewport
) {
  return {
    ...camera,
    ...constrainPosition(
      camera,
      x,
      y,
      viewport
    ),
    target,
  };
}

export function resetCamera() {
  return createCameraModel();
}
