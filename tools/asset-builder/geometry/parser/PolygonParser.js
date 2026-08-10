/**
 * ============================================================================
 * Historia AI
 * Polygon Parser
 * ============================================================================
 *
 * Parses GeoJSON Polygon geometries.
 */

export function parsePolygon(
  geometry
) {
  return {
    type: "Polygon",

    polygons: [
      geometry.coordinates[0] ?? [],
    ],
  };
}