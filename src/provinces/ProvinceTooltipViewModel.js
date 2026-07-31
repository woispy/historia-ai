import {
  getProvinceDisplayName,
  getProvincePopulationText,
} from "./ProvincePresentation";

/**
 * ============================================================================
 * Province Tooltip ViewModel
 * ============================================================================
 */

export function createProvinceTooltipViewModel(
  province
) {
  if (!province) {
    return null;
  }

  return Object.freeze({
    id: province.id,

    title: getProvinceDisplayName(
      province
    ),

    owner: province.owner,

    population:
      getProvincePopulationText(province),
  });
}