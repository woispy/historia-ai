import {
  createCityRepository,
  addCity,
} from "./CityRepository.js";

import { createCity } from "./CityFactory.js";

/**
 * ============================================================================
 * Historia AI
 * City Bootstrap
 * ============================================================================
 */

export function createCityRepositoryFromArray(
  cities
) {
  let repository =
    createCityRepository();

  for (const city of cities) {
    repository = addCity(
      repository,
      createCity(city)
    );
  }

  return repository;
}
