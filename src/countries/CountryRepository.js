/**
 * ============================================================================
 * Historia AI
 * Country Repository
 * ============================================================================
 */

export function createCountryRepository() {
  return {
    byId: {},

    allIds: [],
  };
}

export function addCountry(
  repository,
  country
) {
  return {
    byId: {
      ...repository.byId,

      [country.id]: country,
    },

    allIds: repository.allIds.includes(
      country.id
    )
      ? repository.allIds
      : [...repository.allIds, country.id],
  };
}

export function updateCountry(
  repository,
  country
) {
  return {
    ...repository,

    byId: {
      ...repository.byId,

      [country.id]: country,
    },
  };
}

export function removeCountry(
  repository,
  countryId
) {
  const byId = {
    ...repository.byId,
  };

  delete byId[countryId];

  return {
    byId,

    allIds:
      repository.allIds.filter(
        (id) => id !== countryId
      ),
  };
}