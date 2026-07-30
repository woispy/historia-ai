import { processTurn } from "../Turn";
import { interpretAction } from "../Interpreter";

export function advanceWeek(gameState) {
  return processTurn(gameState, "week");
}

export function advanceMonth(gameState) {
  return processTurn(gameState, "month");
}

export function advanceYear(gameState) {
  return processTurn(gameState, "year");
}

export function queueAction(gameState, actionText) {
  const interpretation = interpretAction(actionText);

  const action = {
    id: crypto.randomUUID(),

    // Action'ın kaynağı
    type: "player",

    source: "player",

    status: "pending",

    createdAt: {
      ...gameState.time.currentDate,
    },

    priority: 0,

    // Oyuncunun yazdığı orijinal metin
    text: actionText,

    // Interpreter çıktısı
    interpretation,

    // Handler'ların kullanacağı veriler
    payload: {},
  };

  return {
    ...gameState,
    pendingActions: [
      ...gameState.pendingActions,
      action,
    ],
  };
}

export function updateAction(gameState, actionId, changes) {
  return {
    ...gameState,
    pendingActions: gameState.pendingActions.map((action) =>
      action.id === actionId
        ? {
            ...action,
            ...changes,
          }
        : action
    ),
  };
}

export function removeAction(gameState, actionId) {
  return {
    ...gameState,
    pendingActions: gameState.pendingActions.filter(
      (action) => action.id !== actionId
    ),
  };
}

export function clearPendingActions(gameState) {
  return {
    ...gameState,
    pendingActions: [],
  };
}