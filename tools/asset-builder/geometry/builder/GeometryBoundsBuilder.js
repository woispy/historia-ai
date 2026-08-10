/**
 * ============================================================================
 * Historia AI
 * Geometry Bounds Builder
 * ============================================================================
 *
 * Calculates the bounding box of one or more polygons.
 */

export function buildGeometryBounds(
  polygons
) {
  if (
    !Array.isArray(polygons) ||
    polygons.length === 0
  ) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  let minX = Infinity;
  let minY = Infinity;

  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const polygon of polygons) {
    for (const point of polygon) {
      const [x, y] = point;

      if (x < minX) minX = x;
      if (y < minY) minY = y;

      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  return {
    minX,
    minY,

    maxX,
    maxY,

    width:
      maxX - minX,

    height:
      maxY - minY,
  };
}