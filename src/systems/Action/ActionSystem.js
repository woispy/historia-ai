import { interpretAction } from "../Interpreter/index.js";
import { processTurn } from "../Turn/TurnEngine.js";

function rebuildGameSession(gameSession, state) {
  return { ...gameSession, state };
}

function createDeterministicActionId(state, actionText, sequence) {
  const date = state?.time?.currentDate ?? {};
  const normalizedText = String(actionText ?? "").trim();

  let hash = 2166136261;
  for (let index = 0; index < normalizedText.length; index += 1) {
    hash ^= normalizedText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const textHash = (hash >>> 0).toString(16).padStart(8, "0");
  return [
    "action",
    date.year ?? 0,
    date.month ?? 0,
    date.day ?? 0,
    state?.time?.turn ?? 0,
    sequence,
    textHash,
  ].join("-");
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
  const normalizedText = actionText.trim();
  const sequence = (Number.isInteger(state.actionSequence) ? state.actionSequence : 0) + 1;
  const interpretation = interpretAction(normalizedText);
  const action = {
    id: createDeterministicActionId(state, normalizedText, sequence),
    type: "player",
    source: "player",
    status: "pending",
    createdAt: { ...state.time.currentDate },
    priority: 0,
    text: normalizedText,
    interpretation,
    payload: {},
  };

  return rebuildGameSession(gameSession, {
    ...state,
    actionSequence: sequence,
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
