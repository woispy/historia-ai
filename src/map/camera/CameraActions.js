/**
 * ============================================================================
 * Historia AI
 * Camera Actions
 * ============================================================================
 */

import {
  createCameraModel,
} from "./CameraModel";

/**
 * Clamps a zoom value within camera limits.
 */
function clampZoom(
  camera,
  zoom
) {
  return Math.max(
    camera.minZoom,
    Math.min(
      camera.maxZoom,
      zoom
    )
  );
}

/**
 * Moves the camera within world space.
 */
export function moveCamera(
  camera,
  dx,
  dy
) {
  return {
    ...camera,

    x: camera.x + dx,

    y: camera.y + dy,
  };
}

/**
 * Changes camera zoom.
 */
export function zoomCamera(
  camera,
  delta
) {
  return {
    ...camera,

    zoom: clampZoom(
      camera,
      camera.zoom + delta
    ),
  };
}

/**
 * Sets an absolute zoom level.
 */
export function setCameraZoom(
  camera,
  zoom
) {
  return {
    ...camera,

    zoom: clampZoom(
      camera,
      zoom
    ),
  };
}

/**
 * Sets the current world position.
 */
export function setCameraPosition(
  camera,
  x,
  y
) {
  return {
    ...camera,

    x,

    y,
  };
}

/**
 * Focuses the camera on a world position.
 */
export function focusCamera(
  camera,
  x,
  y,
  target = null
) {
  return {
    ...camera,

    x,

    y,

    target,
  };
}

export function resetCamera() {
  return createCameraModel();
}