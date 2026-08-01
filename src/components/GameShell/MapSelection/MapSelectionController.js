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

  refresh,
}) {
  selectProvince(
    world,
    provinceId
  );

  if (refresh) {
    refresh();
  }
}