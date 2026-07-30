import {
  clearPendingActions,
  handleAction,
} from "../../Action";

export function processActions(gameState) {
  if (gameState.pendingActions.length === 0) {
    return gameState;
  }

  let nextState = gameState;

  for (const action of gameState.pendingActions) {
    nextState = handleAction(nextState, action);
  }

  nextState = clearPendingActions(nextState);

  return nextState;
}