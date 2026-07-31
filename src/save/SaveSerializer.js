/**
 * ============================================================================
 * Historia AI
 * Save Serializer
 * ============================================================================
 *
 * Converts GameSession objects into a saveable format and restores them.
 *
 * Responsibilities
 * ----------------
 * - Serialize GameSession
 * - Deserialize GameSession
 *
 * Does NOT:
 * - Access localStorage
 * - Create GameSession
 * - Handle save slots
 */

/**
 * Converts a GameSession into a save object.
 *
 * @param {object} session
 * @returns {object}
 */
export function serializeGame(session) {
  if (!session) {
    throw new Error("Game session is required.");
  }

  return {
    version: 1,

    createdAt: session.createdAt,

    lastPlayed: new Date().toISOString(),

    session,
  };
}

/**
 * Restores a GameSession from save data.
 *
 * @param {object} saveData
 * @returns {object}
 */
export function deserializeGame(saveData) {
  if (!saveData) {
    throw new Error("Save data is required.");
  }

  if (!saveData.session) {
    throw new Error("Save data does not contain a game session.");
  }

  return saveData.session;
}