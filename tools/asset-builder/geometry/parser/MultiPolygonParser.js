/**
 * ============================================================================
 * Historia AI
 * MultiPolygon Parser
 * ============================================================================
 *
 * Parses GeoJSON MultiPolygon geometries.
 */

export function parseMultiPolygon(
  geometry
) {
  return {
    type: "MultiPolygon",

    polygons:
      geometry.coordinates.map(
        (polygon) =>
          polygon[0] ?? []
      ),
  };
}