let currentGame = null;

/**
 * ============================================================================
 * Historia AI
 * Current Game
 * ============================================================================
 *
 * Stores the currently active GameSession.
 */

export function setCurrentGame(
  gameSession
) {
  if (!gameSession) {
    throw new Error(
      "Game session is required."
    );
  }

  currentGame = gameSession;
}

export function getCurrentGame() {
  if (!currentGame) {
    throw new Error(
      "No active game session."
    );
  }

  return currentGame;
}

export function updateCurrentGame(
  gameSession
) {
  if (!gameSession) {
    throw new Error(
      "Game session is required."
    );
  }

  currentGame = gameSession;
}

export function clearCurrentGame() {
  currentGame = null;
}

export function hasCurrentGame() {
  return currentGame !== null;
}