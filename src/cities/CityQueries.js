/**
 * ============================================================================
 * Historia AI
 * City Queries
 * ============================================================================
 */

export function getCity(
  repository,
  cityId
) {
  return repository.byId[cityId] ?? null;
}

export function getCities(
  repository
) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getCitiesByOwner(
  repository,
  owner
) {
  return getCities(repository).filter(
    (city) => city.owner === owner
  );
}