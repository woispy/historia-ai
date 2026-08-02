/**
 * ============================================================================
 * Historia AI
 * Camera Model
 * ============================================================================
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