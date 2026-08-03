/**
 * ============================================================================
 * Historia AI
 * Camera Model
 * ============================================================================
 *
 * Camera stores the current world position being viewed.
 *
 * x, y
 * ----
 * World coordinates of the camera.
 *
 * They do NOT represent screen pixels.
 */

export function createCameraModel() {
  return Object.freeze({
    x: 0,

    y: 0,

    zoom: 1,

    target: null,

    minZoom: 0.25,

    maxZoom: 8,
  });
}