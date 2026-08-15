import {
  clearPendingActions,
  handleAction,
} from "../../Action/index.js";

import { getState } from "../../../state/index.js";

export function processActions(gameSession) {
  const state = getState(gameSession);

  if (state.pendingActions.length === 0) {
    return gameSession;
  }

  let nextSession = gameSession;

  for (const action of state.pendingActions) {
    nextSession = handleAction(nextSession, action);
  }

  return clearPendingActions(nextSession);
}
