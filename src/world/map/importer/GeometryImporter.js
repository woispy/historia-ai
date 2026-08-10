import {
  loadGeometry,
} from "./GeometryLoader";

/**
 * ============================================================================
 * Historia AI
 * Geometry Importer
 * ============================================================================
 *
 * Entry point of the Geometry Import Pipeline.
 *
 * Responsibilities
 * ----------------
 * - Loads Geometry Assets.
 * - Executes every import step.
 * - Returns validated Geometry Assets.
 *
 * This module knows nothing about:
 *
 * - Geometry Models
 * - Repositories
 * - Rendering
 * - Runtime State
 *
 * Those responsibilities belong to the Geometry Engine.
 */

export function importGeometry() {
  const geometries =
    loadGeometry();

  return geometries;
}