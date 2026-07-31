import { createProvinceViewModel } from "./ProvinceViewModel";

import {
  getProvinceDisplayName,
  getProvincePopulationText,
  getProvinceDevelopmentText,
} from "./ProvincePresentation";

/**
 * ============================================================================
 * Province ViewModel Factory
 * ============================================================================
 *
 * Converts a Province model into a UI ViewModel.
 */

export function createProvinceViewModelFromProvince(
  province
) {
  if (!province) {
    return null;
  }

  return createProvinceViewModel({
    id: province.id,

    displayName: getProvinceDisplayName(
      province
    ),

    owner: province.owner,

    controller: province.controller,

    terrain: province.terrain,

    population: getProvincePopulationText(
      province
    ),

    development:
      getProvinceDevelopmentText(
        province
      ),

    governor: province.governor,

    fortLevel: province.fortLevel,

    hasPort: province.port,

    hasRiver: province.river,

    culture: province.culture,

    religion: province.religion,
  });
}