let currentGame = null;

/**
 * Stores the current active game session.
 *
 * @param {object} gameSession
 */
export function setCurrentGame(gameSession) {
  if (!gameSession) {
    throw new Error("Game session is required.");
  }

  currentGame = gameSession;
}

/**
 * Returns the current active game session.
 *
 * @returns {object}
 */
export function getCurrentGame() {
  if (!currentGame) {
    throw new Error("No active game session.");
  }

  return currentGame;
}

/**
 * Replaces the current game session.
 *
 * @param {object} gameSession
 */
export function updateCurrentGame(gameSession) {
  if (!gameSession) {
    throw new Error("Game session is required.");
  }

  currentGame = gameSession;
}

/**
 * Clears the active game session.
 */
export function clearCurrentGame() {
  currentGame = null;
}

/**
 * Returns whether a game session currently exists.
 *
 * @returns {boolean}
 */
export function hasCurrentGame() {
  return currentGame !== null;
}

/**
 * Returns the runtime state of the current game session.
 *
 * @returns {object}
 */
export function getCurrentState() {
  return getCurrentGame().state;
}

/**
 * Updates only the runtime state of the current game session.
 *
 * @param {object} state
 * @returns {object}
 */
export function updateCurrentState(state) {
  if (!state) {
    throw new Error("Game state is required.");
  }

  const session = getCurrentGame();

  currentGame = {
    ...session,
    state,
  };

  return currentGame;
}