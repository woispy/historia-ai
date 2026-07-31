import {
  advanceWeeks,
  advanceMonths,
  advanceYears,
} from "../../Time";

import { getRuntimeState } from "../../../state/runtime";

function rebuildRuntime(runtime, state) {
  // Yeni mimari (GameSession)
  if (runtime.state) {
    return {
      ...runtime,
      state,
    };
  }

  // Legacy GameState
  return state;
}

export function processTime(runtime, unit = "week", amount = 1) {
  const state = getRuntimeState(runtime);

  let nextDate = state.time.currentDate;

  switch (unit) {
    case "week":
      nextDate = advanceWeeks(nextDate, amount);
      break;

    case "month":
      nextDate = advanceMonths(nextDate, amount);
      break;

    case "year":
      nextDate = advanceYears(nextDate, amount);
      break;

    default:
      return runtime;
  }

  return rebuildRuntime(runtime, {
    ...state,

    time: {
      ...state.time,
      currentDate: nextDate,
      turn: state.time.turn + 1,
    },
  });
}