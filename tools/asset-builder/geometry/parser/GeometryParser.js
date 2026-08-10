import {
  parsePolygon,
} from "./PolygonParser.js";

import {
  parseMultiPolygon,
} from "./MultiPolygonParser.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Parser
 * ============================================================================
 */

export function parseGeometry(
  geometry
) {
  if (!geometry) {
    throw new Error(
      "Geometry is required."
    );
  }

  switch (
    geometry.type
  ) {
    case "Polygon":
      return parsePolygon(
        geometry
      );

    case "MultiPolygon":
      return parseMultiPolygon(
        geometry
      );

    default:
      throw new Error(
        `Unsupported Geometry Type: ${geometry.type}`
      );
  }
}