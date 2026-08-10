/**
 * ============================================================================
 * Historia AI
 * Camera Model
 * ============================================================================
 *
 * Camera stores the current screen-space translation and zoom.
 * The minimum zoom is the full-world view: zooming out never shrinks the
 * world into a small floating map.
 */

export function createCameraModel() {
  return Object.freeze({
    x: 0,
    y: 0,
    zoom: 1,
    target: null,
    minZoom: 1,
    maxZoom: 8,
  });
}
