import { processTurn } from "../Turn";
import { interpretAction } from "../Interpreter";

/**
 * ============================================================================
 * Historia AI
 * Action System
 * ============================================================================
 *
 * Operates directly on GameSession.
 */

function rebuildGameSession(
  gameSession,
  runtime
) {
  return {
    ...gameSession,

    runtime,
  };
}

export function advanceWeek(
  gameSession
) {
  return processTurn(
    gameSession,
    "week"
  );
}

export function advanceMonth(
  gameSession
) {
  return processTurn(
    gameSession,
    "month"
  );
}

export function advanceYear(
  gameSession
) {
  return processTurn(
    gameSession,
    "year"
  );
}

export function queueAction(
  gameSession,
  actionText
) {
  const runtime =
    gameSession.runtime;

  const interpretation =
    interpretAction(actionText);

  const action = {
    id: crypto.randomUUID(),

    type: "player",

    source: "player",

    status: "pending",

    createdAt: {
      ...runtime.time.currentDate,
    },

    priority: 0,

    text: actionText,

    interpretation,

    payload: {},
  };

  return rebuildGameSession(
    gameSession,
    {
      ...runtime,

      pendingActions: [
        ...runtime.pendingActions,
        action,
      ],
    }
  );
}

export function updateAction(
  gameSession,
  actionId,
  changes
) {
  const runtime =
    gameSession.runtime;

  return rebuildGameSession(
    gameSession,
    {
      ...runtime,

      pendingActions:
        runtime.pendingActions.map(
          (action) =>
            action.id === actionId
              ? {
                  ...action,
                  ...changes,
                }
              : action
        ),
    }
  );
}

export function removeAction(
  gameSession,
  actionId
) {
  const runtime =
    gameSession.runtime;

  return rebuildGameSession(
    gameSession,
    {
      ...runtime,

      pendingActions:
        runtime.pendingActions.filter(
          (action) =>
            action.id !== actionId
        ),
    }
  );
}

export function clearPendingActions(
  gameSession
) {
  return rebuildGameSession(
    gameSession,
    {
      ...gameSession.runtime,

      pendingActions: [],
    }
  );
}