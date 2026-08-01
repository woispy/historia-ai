/**
 * ============================================================================
 * Historia AI
 * Selection Repository
 * ============================================================================
 *
 * Stores the current active selection.
 *
 * Repository is mutable.
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
  repository.currentSelection = selection;
}

export function clearSelection(
  repository
) {
  repository.currentSelection = null;
}