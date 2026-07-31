import { useEffect, useState } from "react";

import GameShell from "../components/GameShell/GameShell";

import {
  hasCurrentGame,
  setCurrentGame,
} from "../game/currentGame";

import {
  hasGameSave,
  loadGame,
} from "../save";

function Game() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Eğer RAM'de aktif oyun yoksa,
    // kayıtlı oyunu yüklemeyi dene.
    if (!hasCurrentGame()) {
      if (hasGameSave()) {
        const session = loadGame();

        if (session) {
          setCurrentGame(session);
        }
      }
    }

    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <GameShell />;
}

export default Game;