/**
 * ============================================================================
 * Historia AI
 * Geometry Module
 * ============================================================================
 *
 * Public API for the Geometry Runtime.
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

export { bootstrapGeometry } from "./GeometryBootstrap.js";

export {
  getGeometry,
  getGeometries,
  getGeometryByProvince,
} from "./GeometryQueries.js";

export {
  loadGeometryManifest,
  loadGeometryAssets,
  loadGeometryRepository,
} from "./loader/index.js";
