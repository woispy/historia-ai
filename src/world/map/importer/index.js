/**
 * ============================================================================
 * Historia AI
 * Geometry Import Module
 * ============================================================================
 *
 * Legacy compatibility exports.
 *
 * NOTE
 * ----
 * The Geometry Import Pipeline has been replaced
 * by the Geometry Asset Loader.
 *
 * New Runtime Pipeline
 * --------------------
 *
 * Geometry Manifest
 *        ↓
 * Geometry Assets
 *        ↓
 * Geometry Repository
 *
 * This module remains temporarily available for
 * backwards compatibility and will be removed
 * after the Runtime migration is complete.
 */

/**
 * ============================================================================
 * Legacy Loader
 * ============================================================================
 */

export {
  loadGeometry,
} from "./GeometryLoader.js";

/**
 * ============================================================================
 * Legacy Validator
 * ============================================================================
 */

export {
  validateGeometry,
  validateGeometries,
} from "./GeometryValidator.js";

/**
 * ============================================================================
 * Legacy Importer
 * ============================================================================
 */

export {
  importGeometry,
} from "./GeometryImporter.js";