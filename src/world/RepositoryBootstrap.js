import {
  createCountryRepositoryFromArray,
} from "../countries";

import {
  createCityRepositoryFromArray,
} from "../cities";

import {
  bootstrapProvinces,
} from "../provinces";

import {
  applyHistoricalProvinceOwnership,
} from "../provinces/HistoricalProvinceOwnership.js";

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
 * Historia AI
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

  const historicalRegistry =
    Object.values(
      scenario.data.historical ?? {}
    )[0] ?? null;

  const scenarioCountries =
    Object.values(
      scenario.data.countries ?? {}
    );

  const historicalCountries =
    Object.values(
      historicalRegistry?.countries ?? {}
    );

  const countriesById = {};

  for (const country of historicalCountries) {
    countriesById[country.id] = country;
  }

  for (const country of scenarioCountries) {
    countriesById[country.id] = {
      ...(countriesById[country.id] ?? {}),
      ...country,
    };
  }

  const provinceRepository =
    applyHistoricalProvinceOwnership(
      bootstrapProvinces(),
      historicalRegistry
    );

  return {
    countries:
      createCountryRepositoryFromArray(
        Object.values(countriesById)
      ),

    cities:
      createCityRepositoryFromArray(
        Object.values(
          scenario.data.cities ?? {}
        )
      ),

    provinces:
      provinceRepository,

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
