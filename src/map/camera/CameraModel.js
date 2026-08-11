/**
 * Historia AI — Camera Model
 *
 * World-space camera tuned for grand-strategy map navigation. Zoom is kept
 * within a readable range so city/province LOD transitions remain predictable.
 */

export function createCameraModel() {
  return Object.freeze({
    x: 0,
    y: 0,
    zoom: 1,
    target: null,
    minZoom: 0.85,
    maxZoom: 40,
  });
}
