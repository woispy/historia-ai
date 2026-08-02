/**
 * ============================================================================
 * Historia AI
 * Camera Queries
 * ============================================================================
 */

export function getCamera(camera) {
  return camera;
}

export function getCameraPosition(camera) {
  return {
    x: camera.x,
    y: camera.y,
  };
}

export function getCameraZoom(camera) {
  return camera.zoom;
}

export function getCameraTarget(camera) {
  return camera.target ?? null;
}