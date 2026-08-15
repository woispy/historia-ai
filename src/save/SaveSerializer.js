/**
 * ============================================================================
 * Historia AI
 * Save Serializer
 * ============================================================================
 *
 * Converts GameSession objects into a saveable format and restores them.
 *
 * Save format v2 stores the canonical GameSession model, including
 * `session.state`. Legacy `session.runtime` saves are intentionally rejected;
 * no compatibility runtime is maintained.
 */

const SAVE_VERSION = 2;

export function serializeGame(session) {
  if (!session) {
    throw new Error("Game session is required.");
  }

  if (!session.state) {
    throw new Error("Game session state is required for save serialization.");
  }

  return {
    version: SAVE_VERSION,
    createdAt: session.createdAt,
    lastPlayed: new Date().toISOString(),
    session,
  };
}

export function deserializeGame(saveData) {
  if (!saveData) {
    throw new Error("Save data is required.");
  }

  if (saveData.version !== SAVE_VERSION) {
    throw new Error(
      `Unsupported save version: ${String(saveData.version)}. Expected ${SAVE_VERSION}.`
    );
  }

  if (!saveData.session) {
    throw new Error("Save data does not contain a game session.");
  }

  if (!saveData.session.state || saveData.session.runtime) {
    throw new Error("Save data contains a legacy runtime model.");
  }

  return saveData.session;
}

export { SAVE_VERSION };
