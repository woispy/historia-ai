/* ============================================================================
 * Factory
 * ========================================================================== */

export {
  createProvince,
} from "./ProvinceFactory";

/* ============================================================================
 * Model
 * ========================================================================== */

export {
  createProvinceModel,
} from "./ProvinceModel";

/* ============================================================================
 * Repository
 * ========================================================================== */

export {
  createProvinceRepository,
  addProvince,
  updateProvince,
  removeProvince,
} from "./ProvinceRepository";

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
} from "./ProvinceQueries";

/* ============================================================================
 * Bootstrap
 * ========================================================================== */

export {
  createProvinceRepositoryFromArray,
} from "./ProvinceBootstrap";

/* ============================================================================
 * Presentation
 * ========================================================================== */

export {
  getProvinceDisplayName,
  getProvincePopulationText,
  getProvinceDevelopmentText,
} from "./ProvincePresentation";

export * from "./presentation";

/* ============================================================================
 * View Models
 * ========================================================================== */

export {
  createProvinceViewModel,
} from "./ProvinceViewModel";

export {
  createProvinceViewModelFromProvince,
} from "./ProvinceViewModelFactory";