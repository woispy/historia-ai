import { interpretAction } from "../Interpreter/index.js";
import { processTurn } from "../Turn/TurnEngine.js";

function rebuildGameSession(gameSession, state) {
  return { ...gameSession, state };
}

export function advanceWeek(gameSession) {
  return processTurn(gameSession, "week", 1);
}

export function advanceMonth(gameSession) {
  return processTurn(gameSession, "month", 1);
}

export function advanceSixMonths(gameSession) {
  return processTurn(gameSession, "month", 6);
}

export function advanceYear(gameSession) {
  return processTurn(gameSession, "year", 1);
}

export function advanceDays(gameSession, days) {
  return processTurn(gameSession, "day", days);
}

export function queueAction(gameSession, actionText) {
  if (!actionText?.trim()) {
    return gameSession;
  }

  const state = gameSession.state;
  const interpretation = interpretAction(actionText);
  const action = {
    id: crypto.randomUUID(),
    type: "player",
    source: "player",
    status: "pending",
    createdAt: { ...state.time.currentDate },
    priority: 0,
    text: actionText.trim(),
    interpretation,
    payload: {},
  };

  return rebuildGameSession(gameSession, {
    ...state,
    pendingActions: [...state.pendingActions, action],
  });
}

export function updateAction(gameSession, actionId, changes) {
  const state = gameSession.state;
  return rebuildGameSession(gameSession, {
    ...state,
    pendingActions: state.pendingActions.map((action) =>
      action.id === actionId ? { ...action, ...changes } : action
    ),
  });
}

export function removeAction(gameSession, actionId) {
  const state = gameSession.state;
  return rebuildGameSession(gameSession, {
    ...state,
    pendingActions: state.pendingActions.filter(
      (action) => action.id !== actionId
    ),
  });
}

export function clearPendingActions(gameSession) {
  return rebuildGameSession(gameSession, {
    ...gameSession.state,
    pendingActions: [],
  });
}
