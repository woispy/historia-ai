/**
 * Returns the runtime state regardless of whether the
 * application is using the legacy GameState or the new GameSession.
 */
export function getRuntimeState(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  return runtime.state ?? runtime;
}

/**
 * Returns the world regardless of runtime model.
 */
export function getWorld(runtime) {
  if (!runtime) {
    throw new Error("Runtime is required.");
  }

  return runtime.world;
}

/**
 * Returns the current game date regardless of runtime model.
 */
export function getCurrentDate(runtime) {
  return getRuntimeState(runtime).time.currentDate;
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