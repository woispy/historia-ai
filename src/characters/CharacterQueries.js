/**
 * ============================================================================
 * Historia AI
 * Character Queries
 * ============================================================================
 */

export function getCharacters(repository) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getCharacter(repository, characterId) {
  return repository.byId[characterId] ?? null;
}

export function getLivingCharacters(repository) {
  return getCharacters(repository).filter(
    (character) => character.alive
  );
}

export function getCharactersByAuthority(
  repository,
  authorityId
) {
  return getCharacters(repository).filter(
    (character) =>
      character.authorityId === authorityId
  );
}

export function getCharactersByLocation(
  repository,
  location
) {
  return getCharacters(repository).filter(
    (character) =>
      character.location === location
  );
}

export function getCharactersByCulture(
  repository,
  culture
) {
  return getCharacters(repository).filter(
    (character) =>
      character.culture === culture
  );
}

export function getCharactersByReligion(
  repository,
  religion
) {
  return getCharacters(repository).filter(
    (character) =>
      character.religion === religion
  );
}

export function getCharactersByFamily(
  repository,
  familyId
) {
  return getCharacters(repository).filter(
    (character) =>
      character.familyId === familyId
  );
}