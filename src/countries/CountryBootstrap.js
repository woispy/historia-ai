import {
  createCountryRepository,
  addCountry,
} from "./CountryRepository.js";

import { createCountry } from "./CountryFactory.js";

/**
 * ============================================================================
 * Historia AI
 * Country Bootstrap
 * ============================================================================
 */

export function createCountryRepositoryFromArray(
  countries
) {
  let repository =
    createCountryRepository();

  for (const country of countries) {
    repository = addCountry(
      repository,

      createCountry(country)
    );
  }

  return repository;
}
