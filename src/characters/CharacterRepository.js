/**
 * ============================================================================
 * Historia AI
 * Character Repository
 * ============================================================================
 *
 * Stores every character in the current world.
 *
 * Repository is responsible only for storage.
 * Character creation belongs to CharacterFactory.
 */

/**
 * Creates an empty repository.
 */
export function createCharacterRepository() {
  return {
    byId: {},
    allIds: [],
  };
}

/**
 * Adds a character.
 */
export function addCharacter(repository, character) {
  if (!repository) {
    throw new Error("Character repository is required.");
  }

  if (!character) {
    throw new Error("Character is required.");
  }

  if (repository.byId[character.id]) {
    throw new Error(
      `Character "${character.id}" already exists.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [character.id]: character,
    },

    allIds: [...repository.allIds, character.id],
  };
}

/**
 * Updates an existing character.
 */
export function updateCharacter(repository, character) {
  if (!repository.byId[character.id]) {
    throw new Error(
      `Character "${character.id}" does not exist.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [character.id]: character,
    },

    allIds: repository.allIds,
  };
}

/**
 * Removes a character.
 */
export function removeCharacter(repository, characterId) {
  if (!repository.byId[characterId]) {
    return repository;
  }

  const nextById = {
    ...repository.byId,
  };

  delete nextById[characterId];

  return {
    byId: nextById,

    allIds: repository.allIds.filter(
      (id) => id !== characterId
    ),
  };
}