import {
  getProvince,
  createProvincePanelViewModel,
} from "../../../provinces";

/**
 * ============================================================================
 * Province Panel Controller
 * ============================================================================
 *
 * Bridges the Province Domain and the UI.
 */

export function getProvincePanelViewModel(
  world,
  provinceId
) {
  if (!world || !provinceId) {
    return null;
  }

  const repository =
    world.repositories?.provinces;

  if (!repository) {
    return null;
  }

  const province = getProvince(
    repository,
    provinceId
  );

  if (!province) {
    return null;
  }

  return createProvincePanelViewModel(
    province
  );
}