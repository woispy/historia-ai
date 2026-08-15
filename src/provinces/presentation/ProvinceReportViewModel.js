import {
  getProvinceDisplayName,
  getProvincePopulationText,
  getProvinceDevelopmentText,
} from "../ProvincePresentation.js";

/**
 * ============================================================================
 * Province Report ViewModel
 * ============================================================================
 */

export function createProvinceReportViewModel(
  province
) {
  if (!province) {
    return null;
  }

  return Object.freeze({
    provinceName:
      getProvinceDisplayName(province),

    owner: province.owner,

    controller: province.controller,

    population:
      getProvincePopulationText(province),

    development:
      getProvinceDevelopmentText(province),

    culture: province.culture,

    religion: province.religion,
  });
}
