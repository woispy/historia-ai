import { useLocation } from "react-router-dom";

import GameShell from "../components/GameShell/GameShell";
import { hasCurrentGame, setCurrentGame, getCurrentGame } from "../game/currentGame";
import { hasGameSave, loadGame } from "../save";

function ensureCurrentGame(handoffSession) {
  if (hasCurrentGame()) {
    return getCurrentGame();
  }

  if (handoffSession) {
    setCurrentGame(handoffSession);
    return handoffSession;
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
  const session = ensureCurrentGame(location.state?.session);

  if (!session) {
    return null;
  }

  return <GameShell />;
}

export default Game;
