/**
 * Camera-aware visibility planning shared by WebGL2 and future WebGPU paths.
 * The index is static; only the viewport query and LOD decision run per frame.
 */

export const PROVINCE_LOD = Object.freeze({
  WORLD: 0,
  REGIONAL: 1,
  PROVINCE: 2,
  DETAIL: 3,
});

export function selectProvinceLod(zoom) {
  const value = Math.max(0, Number(zoom) || 0);
  if (value < 2.5) return PROVINCE_LOD.WORLD;
  if (value < 8) return PROVINCE_LOD.REGIONAL;
  if (value < 24) return PROVINCE_LOD.PROVINCE;
  return PROVINCE_LOD.DETAIL;
}

export function getCameraViewportBounds(camera = {}, aspect = 1) {
  const zoom = Math.max(0.001, Number(camera.zoom) || 1);
  const centerX = Number(camera.x) || 0;
  const centerY = Number(camera.y) || 0;
  const safeAspect = Math.max(0.1, Number(aspect) || 1);
  const halfWidth = 180 / zoom;
  const halfHeight = (90 / zoom) / safeAspect;
  return {
    minX: centerX - halfWidth,
    minY: centerY - halfHeight,
    maxX: centerX + halfWidth,
    maxY: centerY + halfHeight,
  };
}

export function queryVisibleProvinceIndices(index, camera, width, height, out = []) {
  if (!index) return out;
  const aspect = Math.max(1, Number(width) || 1) / Math.max(1, Number(height) || 1);
  return index.query(getCameraViewportBounds(camera, aspect), out);
}

export function buildVisibilityPlan(index, camera, width, height, out = []) {
  const candidates = queryVisibleProvinceIndices(index, camera, width, height, out);
  return {
    lod: selectProvinceLod(camera?.zoom),
    indices: candidates,
    count: candidates.length,
  };
}

export default {
  PROVINCE_LOD,
  selectProvinceLod,
  getCameraViewportBounds,
  queryVisibleProvinceIndices,
  buildVisibilityPlan,
};
