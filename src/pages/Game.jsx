import { Navigate, useLocation } from "react-router-dom";

import GameShell from "../components/GameShell/GameShell";
import { hasCurrentGame, setCurrentGame, getCurrentGame } from "../game/currentGame";
import { hasGameSave, loadGame } from "../save";

function ensureCurrentGame() {
  if (hasCurrentGame()) {
    return getCurrentGame();
  }

  if (hasGameSave()) {
    const session = loadGame();
    if (session) {
      setCurrentGame(session);
      return session;
    }
  }

  return null;
}

function Game() {
  const location = useLocation();
  const session = ensureCurrentGame();

  if (!session) {
    return (
      <Navigate
        to="/new-game"
        replace
        state={{
          reason: "missing-game-session",
          from: location.pathname,
        }}
      />
    );
  }

  return <GameShell />;
}

export default Game;
