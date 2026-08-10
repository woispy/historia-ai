/* ============================================================================
 * Historia AI
 * Provinces Module
 * ========================================================================== */

export { createProvince } from "./ProvinceFactory.js";
export { createProvinceModel } from "./ProvinceModel.js";

export {
  createProvinceRepository,
  addProvince,
  updateProvince,
  removeProvince,
} from "./ProvinceRepository.js";

export {
  getProvince,
  getProvinces,
  getProvinceByName,
  getCoastalProvinces,
  getProvincesByOwner,
  getProvincesByController,
} from "./ProvinceQueries.js";

export { bootstrapProvinces } from "./ProvinceBootstrap.js";
export { createHistoricalProvinceRepository } from "./HistoricalProvinceRepository.js";

export {
  loadProvinceManifest,
  loadProvinceAssets,
  loadProvinceRepository,
  loadHistoricalProvinceRepository,
} from "./loader/index.js";

export {
  getProvinceDisplayName,
  getProvincePopulationText,
  getProvinceDevelopmentText,
} from "./ProvincePresentation.js";

export * from "./presentation/index.js";

export { createProvinceViewModel } from "./ProvinceViewModel.js";
export { createProvinceViewModelFromProvince } from "./ProvinceViewModelFactory.js";
