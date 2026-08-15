export { createCharacter } from "./CharacterFactory.js";

export { createCharacterModel } from "./CharacterModel.js";

export {
  createCharacterRepository,
  addCharacter,
  updateCharacter,
  removeCharacter,
} from "./CharacterRepository.js";

export {
  getCharacter,
  getCharacters,
  getLivingCharacters,
  getCharactersByAuthority,
  getCharactersByLocation,
  getCharactersByCulture,
  getCharactersByReligion,
  getCharactersByFamily,
} from "./CharacterQueries.js";
