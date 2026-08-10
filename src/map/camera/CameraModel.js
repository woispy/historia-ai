/**
 * ============================================================================
 * Historia AI
 * Camera Model
 * ============================================================================
 *
 * Camera position is stored in world degrees rather than CSS pixels. This
 * keeps panning continuous across the antimeridian and lets the SVG renderer
 * use a real viewBox instead of scaling a rasterized DOM layer.
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
