import {
  selectProvince,
} from "./MapSelectionService";

/**
 * ============================================================================
 * Historia AI
 * Map Selection Controller
 * ============================================================================
 *
 * Connects the World Map UI with the
 * Selection Repository.
 */

export function handleProvinceClick({
  world,

  provinceId,

  setWorld,
}) {
  if (!setWorld) {
    return;
  }

  const updatedWorld =
    selectProvince(
      world,
      provinceId
    );

  setWorld(updatedWorld);
}