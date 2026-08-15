import {
  createProvinceViewModelFromProvince,
} from "../ProvinceViewModelFactory.js";

/**
 * ============================================================================
 * Province Panel ViewModel
 * ============================================================================
 *
 * Builds the data required by ProvincePanel.
 */

export function createProvincePanelViewModel(
  province
) {
  return createProvinceViewModelFromProvince(
    province
  );
}
