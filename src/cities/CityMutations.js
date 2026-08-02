import {
  updateCity,
} from "./CityRepository";

/**
 * ============================================================================
 * Historia AI
 * City Mutations
 * ============================================================================
 */

/**
 * Marks a city as under siege.
 */
export function setCityUnderSiege(
  repository,
  cityId,
  underSiege = true
) {
  const city = repository.byId[cityId];

  if (!city) {
    return repository;
  }

  return updateCity(repository, {
    ...city,

    status: {
      ...city.status,

      underSiege,
    },
  });
}