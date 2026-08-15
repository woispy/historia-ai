import {
  getProvinceDisplayName,
} from "../ProvincePresentation.js";

/**
 * ============================================================================
 * Province Advisor ViewModel
 * ============================================================================
 */

export function createProvinceAdvisorViewModel(
  province
) {
  if (!province) {
    return null;
  }

  return Object.freeze({
    provinceId: province.id,

    provinceName:
      getProvinceDisplayName(province),

    owner: province.owner,

    underSiege:
      province.status?.underSiege ?? false,

    occupied:
      province.status?.occupied ?? false,

    looted:
      province.status?.looted ?? false,

    fortLevel: province.fortLevel,

    hasPort: province.port,
  });
}
