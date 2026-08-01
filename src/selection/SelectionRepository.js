/**
 * ============================================================================
 * Historia AI
 * Selection Repository
 * ============================================================================
 *
 * Stores the current active selection.
 *
 * Repository is immutable.
 */

export function createSelectionRepository(
  initialSelection = null
) {
  return {
    currentSelection: initialSelection,
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