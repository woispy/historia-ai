/**
 * ============================================================================
 * Family Queries
 * ============================================================================
 */

export function getFamilies(repository) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getFamily(repository, familyId) {
  return repository.byId[familyId] ?? null;
}

export function getActiveFamilies(repository) {
  return getFamilies(repository).filter(
    (family) => !family.extinct
  );
}

export function getFamiliesByCulture(
  repository,
  culture
) {
  return getFamilies(repository).filter(
    (family) =>
      family.culture === culture
  );
}

export function getFamiliesByReligion(
  repository,
  religion
) {
  return getFamilies(repository).filter(
    (family) =>
      family.religion === religion
  );
}