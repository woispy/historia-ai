export { SelectionTypes } from "./SelectionTypes.js";

/* ============================================================================
 * Factory
 * ========================================================================== */

export {
  createSelection,
} from "./SelectionFactory.js";

/* ============================================================================
 * Model
 * ========================================================================== */

export {
  createSelectionModel,
} from "./SelectionModel.js";

/* ============================================================================
 * Repository
 * ========================================================================== */

export {
  createSelectionRepository,
  setSelection,
  clearSelection,
} from "./SelectionRepository.js";

/* ============================================================================
 * Bootstrap
 * ========================================================================== */

export {
  createSelectionRepositoryFromSelection,
} from "./SelectionBootstrap.js";

/* ============================================================================
 * Queries
 * ========================================================================== */

export {
  getSelection,
  getSelectionId,
  getSelectionType,
  hasSelection,
  isProvinceSelected,
  isCountrySelected,
  isCharacterSelected,
  isCitySelected,
  isArmySelected,
} from "./SelectionQueries.js";
