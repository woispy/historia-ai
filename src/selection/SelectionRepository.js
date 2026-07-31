/**
 * ============================================================================
 * Selection Repository
 * ============================================================================
 *
 * Stores the current active selection.
 */

export function createSelectionRepository() {
  return {
    currentSelection: null,
  };
}

export function setSelection(
  repository,
  selection
) {
  return {
    ...repository,

    currentSelection: selection,
  };
}

export function clearSelection(
  repository
) {
  return {
    ...repository,

    currentSelection: null,
  };
}