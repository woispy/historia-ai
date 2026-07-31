import { getCurrentGame } from "../game/currentGame";

/**
 * ============================================================================
 * Runtime Helpers
 * ============================================================================
 *
 * Provides a unified API for both the legacy GameState and the new
 * GameSession runtime model.
 *
 * Legacy:
 * {
 *   time,
 *   world,
 *   timeline,
 *   pendingActions
 * }
 *
 * GameSession:
 * {
 *   world,
 *   player,
 *   settings,
 *   state: {
 *     time,
 *     timeline,
 *     pendingActions
 *   }
 * }
 */

/**
 * Returns the runtime state regardless of whether the
 * application is using the legacy GameState or the new GameSession.
 */
export function getRuntimeState(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  const state = runtime.state ?? runtime;

  if (!state) {
    throw new Error("Runtime state could not be resolved.");
  }

  return state;
}

/**
 * Creates a new runtime after the RuntimeState has changed.
 *
 * Legacy GameState:
 *   returns the updated state.
 *
 * GameSession:
 *   returns a cloned GameSession with the new RuntimeState.
 */
export function updateRuntimeState(runtime, nextState) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  if (!nextState) {
    throw new Error("Next runtime state is required.");
  }

  // New architecture (GameSession)
  if ("state" in runtime) {
    return {
      ...runtime,
      state: nextState,
    };
  }

  // Legacy architecture (GameState)
  return nextState;
}

/**
 * Returns the world regardless of runtime model.
 */
export function getWorld(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  // Legacy GameState
  if ("world" in runtime) {
    return runtime.world;
  }

  // RuntimeState -> Active GameSession
  const session = getCurrentGame();

  if (!session.world) {
    throw new Error("GameSession is missing world.");
  }

  return session.world;
}

/**
 * Returns the player regardless of runtime model.
 */
export function getPlayer(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  // Legacy GameState
  if ("player" in runtime) {
    return runtime.player ?? {};
  }

  return getCurrentGame().player ?? {};
}

/**
 * Returns the session settings regardless of runtime model.
 */
export function getSettings(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  // Legacy GameState
  if ("settings" in runtime) {
    return runtime.settings ?? {};
  }

  return getCurrentGame().settings ?? {};
}

/**
 * Returns the current game date regardless of runtime model.
 */
export function getCurrentDate(runtime) {
  const state = getRuntimeState(runtime);

  if (!state.time) {
    throw new Error("Runtime state is missing time.");
  }

  return state.time.currentDate;
}

/**
 * Returns the timeline regardless of runtime model.
 */
export function getTimeline(runtime) {
  return getRuntimeState(runtime).timeline;
}

/**
 * Returns pending actions regardless of runtime model.
 */
export function getPendingActions(runtime) {
  return getRuntimeState(runtime).pendingActions;
}