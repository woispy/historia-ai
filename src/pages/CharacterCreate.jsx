import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CharacterService from "../services/CharacterService";
import CharacterReport from "../components/CharacterReport";

function CharacterCreate() {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");

  const [character, setCharacter] = useState(null);

  function generateCharacter() {
    const result = CharacterService.create(description);

    setCharacter(result);
  }

  return (
    <Layout title="Karakter Oluştur">
      <p>
        Karakterinizi birkaç cümleyle anlatın.
      </p>

      <textarea
        rows="8"
        cols="60"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br />
      <br />

      <button onClick={generateCharacter}>
        Karakteri Oluştur
      </button>

      <br />
      <br />

      {character && (
        <>
          <h3>Karakter Analizi</h3>

          <CharacterReport character={character} />

          <h4>Kişilik</h4>

          <ul>
            {character.personality.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>

          <button onClick={() => navigate("/game")}>
            Karakteri Kabul Et
          </button>
        </>
      )}
    </Layout>
  );
}

export default CharacterCreate;