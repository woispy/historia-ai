/**
 * ============================================================================
 * Historia AI
 * Character Queries
 * ============================================================================
 */

/**
 * Returns every character.
 */
export function getCharacters(repository) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

/**
 * Returns one character.
 */
export function getCharacter(repository, characterId) {
  return repository.byId[characterId] ?? null;
}

/**
 * Returns every living character.
 */
export function getLivingCharacters(repository) {
  return getCharacters(repository).filter(
    (character) => character.alive
  );
}

/**
 * Returns every character with the given authority.
 */
export function getCharactersByAuthority(
  repository,
  authorityId
) {
  return getCharacters(repository).filter(
    (character) =>
      character.authorityId === authorityId
  );
}

/**
 * Returns every character in the given location.
 */
export function getCharactersByLocation(
  repository,
  location
) {
  return getCharacters(repository).filter(
    (character) =>
      character.location === location
  );
}

/**
 * Returns every character of a culture.
 */
export function getCharactersByCulture(
  repository,
  culture
) {
  return getCharacters(repository).filter(
    (character) =>
      character.culture === culture
  );
}

/**
 * Returns every character of a religion.
 */
export function getCharactersByReligion(
  repository,
  religion
) {
  return getCharacters(repository).filter(
    (character) =>
      character.religion === religion
  );
}