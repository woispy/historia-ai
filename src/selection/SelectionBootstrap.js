import {
  createSelectionRepository,
} from "./SelectionRepository";

/**
 * ============================================================================
 * Historia AI
 * Selection Bootstrap
 * ============================================================================
 *
 * Creates the initial Selection Repository.
 */

export function createSelectionRepositoryFromSelection(
  selection = null
) {
  return createSelectionRepository(
    selection
  );
}