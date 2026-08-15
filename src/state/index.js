export {
  createRuntimeState,
} from "./RuntimeState.js";

export function getState(gameSession) {
  if (!gameSession) {
    throw new Error("GameSession is required.");
  }

  if (!gameSession.state) {
    throw new Error("GameSession state is required.");
  }

  return gameSession.state;
}

export function updateState(gameSession, state) {
  if (!gameSession) {
    throw new Error("GameSession is required.");
  }

  if (!state) {
    throw new Error("State is required.");
  }

  return {
    ...gameSession,
    state,
  };
}

export function getCurrentDate(gameSession) {
  return getState(gameSession).time.currentDate;
}

export function getTimeline(gameSession) {
  return getState(gameSession).timeline;
}

export function getPendingActions(gameSession) {
  return getState(gameSession).pendingActions;
}
