import {
  clearPendingActions,
  handleAction,
} from "../../Action";

import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes every queued player action.
 *
 * Works with both the legacy GameState and the new GameSession.
 */
export function processActions(runtime) {
  const state = getRuntimeState(runtime);

  if (state.pendingActions.length === 0) {
    return runtime;
  }

  let nextRuntime = runtime;

  for (const action of state.pendingActions) {
    nextRuntime = handleAction(nextRuntime, action);
  }

  nextRuntime = clearPendingActions(nextRuntime);

  return nextRuntime;
}