/**
 * ============================================================================
 * Historia AI
 * Scenario Repository Bootstrap
 * ============================================================================
 *
 * Converts immutable scenario resources into
 * runtime repositories.
 */

import {
  createProvinceRepositoryFromArray,
} from "../../provinces";

import {
  createCountryRepositoryFromArray,
} from "../../countries";

import {
  createCityRepositoryFromArray,
} from "../../cities";

export function bootstrapRepositories(
  scenario,
  map
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  if (!map) {
    throw new Error(
      "Map is required."
    );
  }

  const provinces =
    Object.values(
      scenario.data.provinces ?? {}
    );

  const countries =
    Object.values(
      scenario.data.countries ?? {}
    );

  const cities =
    Object.values(
      scenario.data.cities ?? {}
    );

  return {
    countries:
      createCountryRepositoryFromArray(
        countries
      ),

    cities:
      createCityRepositoryFromArray(
        cities
      ),

    provinces:
      createProvinceRepositoryFromArray(
        provinces
      ),
  };
}