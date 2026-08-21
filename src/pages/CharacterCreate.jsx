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
  const [isStartingGame, setIsStartingGame] = useState(false);

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
    if (!character || isStartingGame) return;

    setError("");
    setIsStartingGame(true);

    const newGame = getNewGame();

    if (!newGame.scenarioId) {
      setIsStartingGame(false);
      navigate("/scenario", { replace: true });
      return;
    }

    if (!newGame.countryId) {
      setIsStartingGame(false);
      navigate("/country", { replace: true });
      return;
    }

    try {
      updateNewGame({ character });
      const session = initializeGame();

      if (!session?.id) {
        throw new Error("Oyun oturumu oluşturulamadı.");
      }

      // The runtime session is authoritative and has already been registered
      // by initializeGame. Router state carries only the opaque session id;
      // the complete GameSession never crosses the route boundary.
      navigate("/game", {
        replace: true,
        state: {
          sessionId: session.id,
        },
      });

      // Browser history/navigation can be disrupted by a stale document,
      // an extension, or a transient router remount. The initial save created
      // by initializeGame is already durable, so use it as a deterministic
      // recovery path only if the SPA transition did not actually land on
      // /game. Under normal operation this timer does nothing.
      window.setTimeout(() => {
        if (window.location.pathname !== "/game") {
          window.location.assign("/game");
        }
      }, 0);
    } catch (initializationError) {
      setIsStartingGame(false);
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

      <button type="button" onClick={generateCharacter}>
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

          <button
            type="button"
            onClick={acceptCharacter}
            disabled={isStartingGame}
          >
            {isStartingGame ? "Oyun Başlatılıyor..." : "Karakteri Kabul Et"}
          </button>
        </>
      )}
    </Layout>
  );
}

export default CharacterCreate;
