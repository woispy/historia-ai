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
  const session = ensureCurrentGame();

  if (!session) {
    return null;
  }

  return <GameShell />;
}

export default Game;
