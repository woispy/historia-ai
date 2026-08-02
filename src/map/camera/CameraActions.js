/**
 * ============================================================================
 * Historia AI
 * Camera Actions
 * ============================================================================
 */

import {
  createCameraModel,
} from "./CameraModel";

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

export function zoomCamera(
  camera,
  delta
) {
  return {
    ...camera,

    zoom: Math.max(
      camera.minZoom,

      Math.min(
        camera.maxZoom,

        camera.zoom + delta
      )
    ),
  };
}

export function setCameraZoom(
  camera,
  zoom
) {
  return {
    ...camera,

    zoom: Math.max(
      camera.minZoom,

      Math.min(
        camera.maxZoom,
        zoom
      )
    ),
  };
}

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