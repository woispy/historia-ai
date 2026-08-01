/**
 * ============================================================================
 * Historia AI
 * Country Queries
 * ============================================================================
 */

export function getCountry(
  repository,
  countryId
) {
  return (
    repository.byId[countryId] ??
    null
  );
}

export function getCountries(
  repository
) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getCountryCapital(
  repository,
  countryId
) {
  return (
    getCountry(
      repository,
      countryId
    )?.capital ?? null
  );
}

export function getPlayableCountries(
  repository
) {
  return getCountries(repository).filter(
    (country) => country.playable
  );
}