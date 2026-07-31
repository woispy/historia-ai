export { createCharacter } from "./CharacterFactory";

export { createCharacterModel } from "./CharacterModel";

export {
  createCharacterRepository,
  addCharacter,
  updateCharacter,
  removeCharacter,
} from "./CharacterRepository";

export {
  getCharacter,
  getCharacters,
  getLivingCharacters,
  getCharactersByAuthority,
  getCharactersByLocation,
  getCharactersByCulture,
  getCharactersByReligion,
} from "./CharacterQueries";