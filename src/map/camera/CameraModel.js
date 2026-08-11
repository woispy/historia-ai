/**
 * Historia AI — Camera Model
 *
 * Phase 2G keeps a broad world view while preserving enough zoom range for
 * province and city LODs. The map renderer owns visual LOD; the camera only
 * owns navigation bounds.
 */

export function createCameraModel() {
  return Object.freeze({
    x: 0,
    y: 0,
    zoom: 1,
    target: null,
    minZoom: 0.75,
    maxZoom: 48,
  });
}
