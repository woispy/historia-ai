import CharacterEngine from "../engine/CharacterEngine";

const CharacterService = {

    create(description){

        return CharacterEngine.createCharacter(description);

    }

};

export default CharacterService;