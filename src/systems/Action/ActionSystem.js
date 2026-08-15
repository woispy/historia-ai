import { interpretAction } from "../Interpreter";
import { advanceWeek, advanceMonth, advanceSixMonths, advanceYear } from "../Turn";

function rebuildGameSession(gameSession, state) {
  return { ...gameSession, state };
}

export function advanceWeek(gameSession) {
  return advanceGame(gameSession, "week", 1);
}

export function advanceMonth(gameSession) {
  return advanceGame(gameSession, "month", 1);
}

export function advanceSixMonths(gameSession) {
  return advanceGame(gameSession, "month", 6);
}

export function advanceYear(gameSession) {
  return advanceGame(gameSession, "year", 1);
}

export function advanceDays(gameSession, days) {
  return advanceGame(gameSession, "day", days);
}

function advanceGame(gameSession, unit, amount) {
  // This internal import-free dispatch keeps legacy action exports usable while
  // the public gameplay path is migrated to GameEngine.
  if (unit === "week" && amount === 1) return advanceWeek(gameSession);
  if (unit === "month" && amount === 1) return advanceMonth(gameSession);
  if (unit === "month" && amount === 6) return advanceSixMonths(gameSession);
  if (unit === "year" && amount === 1) return advanceYear(gameSession);
  return gameSession;
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
