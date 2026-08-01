import {
  createSelection,
  SelectionTypes,
  setSelection,
  clearSelection,
} from "../../../selection";

/**
 * ============================================================================
 * Historia AI
 * Map Selection Service
 * ============================================================================
 *
 * Updates the current map selection.
 */

export function selectProvince(
  world,
  provinceId
) {
  if (!world || !provinceId) {
    return;
  }

  const repositories =
    world.repositories;

  if (!repositories) {
    return;
  }

  const selectionRepository =
    repositories.selection;

  if (!selectionRepository) {
    return;
  }

  const selection =
    createSelection({
      type: SelectionTypes.PROVINCE,

      id: provinceId,
    });

  setSelection(
    selectionRepository,
    selection
  );
}

export function clearMapSelection(
  world
) {
  if (!world) {
    return;
  }

  const repositories =
    world.repositories;

  if (!repositories) {
    return;
  }

  clearSelection(
    repositories.selection
  );
}