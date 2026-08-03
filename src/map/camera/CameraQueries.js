/**
 * ============================================================================
 * Historia AI
 * Camera Queries
 * ============================================================================
 */

export function getCamera(
  camera
) {
  return camera;
}

/**
 * Returns the current world position.
 */
export function getCameraPosition(
  camera
) {
  return {
    x: camera.x,

    y: camera.y,
  };
}

export function getCameraZoom(
  camera
) {
  return camera.zoom;
}

export function getCameraTarget(
  camera
) {
  return camera.target ?? null;
}