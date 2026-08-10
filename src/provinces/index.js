/* ============================================================================
 * Historia AI
 * Provinces Module
 * ============================================================================
 *
 * Public API for the Province Runtime.
 */

/* ============================================================================
 * Factory
 * ========================================================================== */

export {
  createProvince,
} from "./ProvinceFactory.js";

/* ============================================================================
 * Model
 * ========================================================================== */

export {
  createProvinceModel,
} from "./ProvinceModel.js";

/* ============================================================================
 * Repository
 * ========================================================================== */

export {
  createProvinceRepository,
  addProvince,
  updateProvince,
  removeProvince,
} from "./ProvinceRepository.js";

/* ============================================================================
 * Queries
 * ========================================================================== */

export {
  getProvince,
  getProvinces,
  getProvinceByName,
  getCoastalProvinces,
  getProvincesByOwner,
  getProvincesByController,
} from "./ProvinceQueries.js";

/* ============================================================================
 * Bootstrap
 * ========================================================================== */

export {
  bootstrapProvinces,
  createProvinceRepositoryFromArray,
} from "./ProvinceBootstrap.js";

/* ============================================================================
 * Loader
 * ========================================================================== */

export {
  loadProvinceManifest,
  loadProvinceAssets,
  loadProvinceRepository,
} from "./loader/index.js";

/* ============================================================================
 * Presentation
 * ========================================================================== */

export {
  getProvinceDisplayName,
  getProvincePopulationText,
  getProvinceDevelopmentText,
} from "./ProvincePresentation.js";

export * from "./presentation/index.js";

/* ============================================================================
 * View Models
 * ========================================================================== */

export {
  createProvinceViewModel,
} from "./ProvinceViewModel.js";

export {
  createProvinceViewModelFromProvince,
} from "./ProvinceViewModelFactory.js";