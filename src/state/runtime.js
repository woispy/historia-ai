/**
 * ============================================================================
 * Historia AI
 * Runtime Helpers
 * ============================================================================
 *
 * Helpers for GameSession runtime access.
 *
 * GameSession
 * ├── scenario
 * ├── world
 * ├── runtime
 * ├── player
 * └── settings
 */

/**
 * Returns the mutable runtime.
 */
export function getRuntime(gameSession) {
  if (!gameSession) {
    throw new Error("GameSession is required.");
  }

  return gameSession.runtime;
}

/**
 * Returns a cloned GameSession with an updated runtime.
 */
export function updateRuntime(
  gameSession,
  runtime
) {
  if (!gameSession) {
    throw new Error("GameSession is required.");
  }

  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  return {
    ...gameSession,

    runtime,
  };
}

/**
 * Runtime helpers
 */

export function getCurrentDate(
  gameSession
) {
  return getRuntime(gameSession).time.currentDate;
}

export function getTimeline(
  gameSession
) {
  return getRuntime(gameSession).timeline;
}

export function getPendingActions(
  gameSession
) {
  return getRuntime(gameSession)
    .pendingActions;
}