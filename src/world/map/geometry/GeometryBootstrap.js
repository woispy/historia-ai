import {
  loadGeometryRepository,
} from "./loader/index.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Bootstrap
 * ============================================================================
 *
 * Builds the runtime Geometry Repository
 * from generated Geometry Assets.
 *
 * Pipeline
 * --------
 *
 * Geometry Manifest
 *        ↓
 * Geometry Assets
 *        ↓
 * Geometry Repository
 */

export function bootstrapGeometry() {
  return loadGeometryRepository();
}