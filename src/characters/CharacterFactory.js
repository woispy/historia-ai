import { createCharacterModel } from "./CharacterModel.js";

/**
 * ============================================================================
 * Character Factory
 * ============================================================================
 */

export function createCharacter(data) {
  if (!data) {
    throw new Error("Character data is required.");
  }

  if (!data.id) {
    throw new Error("Character id is required.");
  }

  if (!data.firstName) {
    throw new Error("Character firstName is required.");
  }

  if (!data.birthDate) {
    throw new Error("Character birthDate is required.");
  }

  if (!data.gender) {
    throw new Error("Character gender is required.");
  }

  if (!data.culture) {
    throw new Error("Character culture is required.");
  }

  if (!data.religion) {
    throw new Error("Character religion is required.");
  }

  if (!data.location) {
    throw new Error("Character location is required.");
  }

  return createCharacterModel(data);
}
