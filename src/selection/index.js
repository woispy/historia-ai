export { SelectionTypes } from "./SelectionTypes";

/* ============================================================================
 * Factory
 * ========================================================================== */

export {
  createSelection,
} from "./SelectionFactory";

/* ============================================================================
 * Model
 * ========================================================================== */

export {
  createSelectionModel,
} from "./SelectionModel";

/* ============================================================================
 * Repository
 * ========================================================================== */

export {
  createSelectionRepository,
  setSelection,
  clearSelection,
} from "./SelectionRepository";

/* ============================================================================
 * Bootstrap
 * ========================================================================== */

export {
  createSelectionRepositoryFromSelection,
} from "./SelectionBootstrap";

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
} from "./SelectionQueries";