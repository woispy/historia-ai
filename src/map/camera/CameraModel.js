/**
 * Historia AI — Camera Model
 *
 * The camera uses canonical geographic coordinates. Horizontal position is
 * periodic across the [-180, 180) longitude interval; vertical position stays
 * constrained to the finite world extent.
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
