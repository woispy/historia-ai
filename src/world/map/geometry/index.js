/**
 * ============================================================================
 * Historia AI
 * Geometry Module
 * ============================================================================
 *
 * Public API for the Geometry Runtime.
 */

/**
 * ============================================================================
 * Geometry Factory
 * ============================================================================
 */

export {
  createGeometry,
} from "./GeometryFactory.js";

/**
 * ============================================================================
 * Geometry Repository
 * ============================================================================
 */

export {
  createGeometryRepository,
  addGeometry,
  updateGeometry,
  removeGeometry,
  findGeometryById,
  findAllGeometries,
  hasGeometry,
  countGeometries,
  isGeometryRepositoryEmpty,
} from "./GeometryRepository.js";

/**
 * ============================================================================
 * Geometry Bootstrap
 * ============================================================================
 */

export {
  bootstrapGeometry,
} from "./GeometryBootstrap.js";

/**
 * ============================================================================
 * Geometry Queries
 * ============================================================================
 */

export {
  getGeometry,
  getGeometries,
  getGeometryByProvince,
} from "./GeometryQueries.js";

/**
 * ============================================================================
 * Geometry Loader
 * ============================================================================
 */

export {
  loadGeometryManifest,
  loadGeometryAssets,
  loadGeometryRepository,
} from "./loader/index.js";