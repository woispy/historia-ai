/**
 * ============================================================================
 * Historia AI
 * City Repository
 * ============================================================================
 */

export function createCityRepository() {
  return {
    byId: {},

    allIds: [],
  };
}

export function addCity(
  repository,
  city
) {
  return {
    byId: {
      ...repository.byId,

      [city.id]: city,
    },

    allIds: repository.allIds.includes(city.id)
      ? repository.allIds
      : [...repository.allIds, city.id],
  };
}

export function updateCity(
  repository,
  city
) {
  return {
    ...repository,

    byId: {
      ...repository.byId,

      [city.id]: city,
    },
  };
}

export function removeCity(
  repository,
  cityId
) {
  const byId = {
    ...repository.byId,
  };

  delete byId[cityId];

  return {
    byId,

    allIds: repository.allIds.filter(
      (id) => id !== cityId
    ),
  };
}