import {
  createSelection,
  SelectionTypes,
  setSelection,
} from "../../../selection";

/**
 * ============================================================================
 * Historia AI
 * Map Selection Service
 * ============================================================================
 *
 * Updates the current selection after the player
 * clicks an object on the world map.
 */

export function selectProvince(
  world,
  provinceId
) {
  if (!world) {
    return world;
  }

  if (!provinceId) {
    return world;
  }

  const repositories =
    world.repositories;

  if (!repositories) {
    return world;
  }

  const selectionRepository =
    repositories.selection;

  if (!selectionRepository) {
    return world;
  }

  const selection =
    createSelection({
      type: SelectionTypes.PROVINCE,

      id: provinceId,
    });

  return {
    ...world,

    repositories: {
      ...repositories,

      selection: setSelection(
        selectionRepository,
        selection
      ),
    },
  };
}

export function clearMapSelection(
  world
) {
  if (!world) {
    return world;
  }

  const repositories =
    world.repositories;

  if (!repositories) {
    return world;
  }

  return {
    ...world,

    repositories: {
      ...repositories,

      selection: {
        currentSelection: null,
      },
    },
  };
}