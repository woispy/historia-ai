import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../layouts/Layout/Layout";
import CharacterService from "../services/CharacterService";
import CharacterReport from "../components/CharacterReport";

import {
  getNewGame,
  updateNewGame,
} from "../game/newGame";

import {
  initializeGame,
} from "../bootstrap";

function CharacterCreate() {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const newGame = getNewGame();

    if (!newGame.scenarioId) {
      navigate("/scenario", { replace: true });
      return;
    }

    if (!newGame.countryId) {
      navigate("/country", { replace: true });
    }
  }, [navigate]);

  function generateCharacter() {
    setError("");

    const result = CharacterService.create(description);
    setCharacter(result);
  }

  function acceptCharacter() {
    if (!character) return;

    setError("");

    const newGame = getNewGame();

    if (!newGame.scenarioId) {
      navigate("/scenario", { replace: true });
      return;
    }

    if (!newGame.countryId) {
      navigate("/country", { replace: true });
      return;
    }

    try {
      updateNewGame({ character });
      const session = initializeGame();

      // Carry the freshly-created runtime session through the router handoff.
      // This keeps the transition deterministic even if a browser/runtime
      // boundary causes the module-level current-game reference to be lost.
      navigate("/game", {
        replace: true,
        state: {
          handoff: "new-game",
          session,
        },
      });
    } catch (initializationError) {
      setError(
        initializationError instanceof Error
          ? initializationError.message
          : "Oyun başlatılamadı.",
      );
    }
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
        onChange={(event) => setDescription(event.target.value)}
      />

      <br />
      <br />

      <button onClick={generateCharacter}>
        Karakteri Oluştur
      </button>

      {error && (
        <p role="alert" style={{ color: "#d66" }}>
          {error}
        </p>
      )}

      <br />
      <br />

      {character && (
        <>
          <h3>
            Karakter Analizi
          </h3>

          <CharacterReport character={character} />

          <h4>
            Kişilik
          </h4>

          <ul>
            {character.personality.map((trait) => (
              <li key={trait}>
                {trait}
              </li>
            ))}
          </ul>

          <button onClick={acceptCharacter}>
            Karakteri Kabul Et
          </button>
        </>
      )}
    </Layout>
  );
}

export default CharacterCreate;
