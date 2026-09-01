import { SelectionTypes } from "./SelectionTypes.js";

/**
 * ============================================================================
 * Selection Queries
 * ============================================================================
 */

export function getSelection(repository) {
  return repository.currentSelection;
}

export function getSelectionId(repository) {
  return repository.currentSelection?.id ?? null;
}

export function getSelectionType(repository) {
  return repository.currentSelection?.type ?? null;
}

export function hasSelection(repository) {
  return repository.currentSelection !== null;
}

export function isProvinceSelected(
  repository
) {
  return (
    getSelectionType(repository) ===
    SelectionTypes.PROVINCE
  );
}

export function isCountrySelected(
  repository
) {
  return (
    getSelectionType(repository) ===
    SelectionTypes.COUNTRY
  );
}

export function isCharacterSelected(
  repository
) {
  return (
    getSelectionType(repository) ===
    SelectionTypes.CHARACTER
  );
}

export function isCitySelected(
  repository
) {
  return (
    getSelectionType(repository) ===
    SelectionTypes.CITY
  );
}

export function isArmySelected(
  repository
) {
  return (
    getSelectionType(repository) ===
    SelectionTypes.ARMY
  );
}

/**
 * Resolve the currently selected province against the canonical simulation
 * state. Selection stores only the stable province ID; it never owns a
 * province snapshot.
 */
export function getSelectedProvince(selectionRepository, worldState) {
  if (!selectionRepository || !worldState) return null;
  if (!isProvinceSelected(selectionRepository)) return null;

  const provinceId = getSelectionId(selectionRepository);
  if (!provinceId) return null;

  return worldState.provinces?.byId?.[provinceId] ?? null;
}
