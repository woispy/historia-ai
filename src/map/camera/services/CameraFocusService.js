import {
  getGeometryByProvince,
} from "../../world/map/geometry/GeometryQueries";

/**
 * ============================================================================
 * Historia AI
 * Camera Focus Service
 * ============================================================================
 */

export function getProvinceFocus(
  geometryRepository,
  provinceId
) {
  const geometry =
    getGeometryByProvince(
      geometryRepository,
      provinceId
    );

  if (!geometry) {
    return null;
  }

  return {
    x: geometry.position.x,

    y: geometry.position.y,

    provinceId,
  };
}