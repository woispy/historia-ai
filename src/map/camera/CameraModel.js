/**
 * Historia AI — Camera Model
 *
 * The world view is a single finite map. Horizontal wrapping is disabled so
 * the renderer, political texture and physical coastline can never diverge
 * into multiple visible map copies at world zoom.
 */
export function createCameraModel() {
  return Object.freeze({
    x: 0,
    y: 0,
    zoom: 1,
    target: null,
    minZoom: 1,
    maxZoom: 48,
  });
}
