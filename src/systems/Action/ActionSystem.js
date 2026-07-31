import { processTurn } from "../Turn";
import { interpretAction } from "../Interpreter";
import {
  getRuntimeState,
} from "../../state/runtime";

function rebuildRuntime(runtime, state) {
  if (runtime.state) {
    return {
      ...runtime,
      state,
    };
  }

  return state;
}

export function advanceWeek(runtime) {
  return processTurn(runtime, "week");
}

export function advanceMonth(runtime) {
  return processTurn(runtime, "month");
}

export function advanceYear(runtime) {
  return processTurn(runtime, "year");
}

export function queueAction(runtime, actionText) {
  const state = getRuntimeState(runtime);

  const interpretation = interpretAction(actionText);

  const action = {
    id: crypto.randomUUID(),

    type: "player",

    source: "player",

    status: "pending",

    createdAt: {
      ...state.time.currentDate,
    },

    priority: 0,

    text: actionText,

    interpretation,

    payload: {},
  };

  return rebuildRuntime(runtime, {
    ...state,

    pendingActions: [
      ...state.pendingActions,
      action,
    ],
  });
}

export function updateAction(runtime, actionId, changes) {
  const state = getRuntimeState(runtime);

  return rebuildRuntime(runtime, {
    ...state,

    pendingActions: state.pendingActions.map((action) =>
      action.id === actionId
        ? {
            ...action,
            ...changes,
          }
        : action
    ),
  });
}

export function removeAction(runtime, actionId) {
  const state = getRuntimeState(runtime);

  return rebuildRuntime(runtime, {
    ...state,

    pendingActions: state.pendingActions.filter(
      (action) => action.id !== actionId
    ),
  });
}

export function clearPendingActions(runtime) {
  const state = getRuntimeState(runtime);

  return rebuildRuntime(runtime, {
    ...state,

    pendingActions: [],
  });
}