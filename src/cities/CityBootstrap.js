import {
  createCityRepository,
  addCity,
} from "./CityRepository";

import { createCity } from "./CityFactory";

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