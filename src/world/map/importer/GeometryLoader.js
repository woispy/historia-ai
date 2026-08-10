import geometries from "../assets/geometry";

import {
  validateGeometries,
} from "./GeometryValidator";

/**
 * ============================================================================
 * Historia AI
 * Geometry Loader
 * ============================================================================
 *
 * Loads raw geometry assets and validates them
 * before they enter the Geometry Engine.
 */

export function loadGeometry() {
  return validateGeometries(
    geometries
  );
}