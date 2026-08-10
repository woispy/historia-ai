/**
 * ============================================================================
 * Historia AI
 * Geometry Center Builder
 * ============================================================================
 *
 * Calculates the geometric center
 * from a Bounding Box.
 *
 * This module is intentionally independent
 * from Geometry parsing logic.
 */

export function buildGeometryCenter(
  bounds
) {
  return {
    x:
      bounds.minX +
      bounds.width / 2,

    y:
      bounds.minY +
      bounds.height / 2,
  };
}