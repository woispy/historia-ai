import {
  clearPendingActions,
  handleAction,
} from "../../Action";

import {
  getRuntime,
} from "../../../state";

export function processActions(
  gameSession
) {
  const runtime =
    getRuntime(gameSession);

  if (
    runtime.pendingActions.length === 0
  ) {
    return gameSession;
  }

  let nextSession =
    gameSession;

  for (const action of runtime.pendingActions) {
    nextSession =
      handleAction(
        nextSession,
        action
      );
  }

  nextSession =
    clearPendingActions(
      nextSession
    );

  return nextSession;
}