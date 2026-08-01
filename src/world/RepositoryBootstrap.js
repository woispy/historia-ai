import {
  createCountryRepositoryFromArray,
} from "../countries";

import {
  createCityRepositoryFromArray,
} from "../cities";

import {
  createProvinceRepositoryFromArray,
} from "../provinces";

import {
  createCharacterRepository,
} from "../characters";

import {
  createFamilyRepository,
} from "../family";

import {
  createKnowledgeRepository,
} from "../knowledge";

import {
  createSelectionRepository,
} from "../selection";

/**
 * ============================================================================
 * Repository Bootstrap
 * ============================================================================
 *
 * Creates every runtime repository.
 */

export function createRepositories(
  scenario
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  return {
    countries:
      createCountryRepositoryFromArray(
        Object.values(
          scenario.data.countries ?? {}
        )
      ),

    cities:
      createCityRepositoryFromArray(
        Object.values(
          scenario.data.cities ?? {}
        )
      ),

    provinces:
      createProvinceRepositoryFromArray(
        Object.values(
          scenario.data.provinces ?? {}
        )
      ),

    characters:
      createCharacterRepository(),

    families:
      createFamilyRepository(),

    knowledge:
      createKnowledgeRepository(),

    selection:
      createSelectionRepository(),
  };
}