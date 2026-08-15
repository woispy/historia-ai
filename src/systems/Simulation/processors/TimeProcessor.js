import {
  advanceDays,
  advanceWeeks,
  advanceMonths,
  advanceYears,
} from "../../Time";
import { getState, updateState } from "../../../state";

export function processTime(gameSession, unit = "week", amount = 1) {
  const state = getState(gameSession);
  let nextDate = state.time.currentDate;

  switch (unit) {
    case "day":
      nextDate = advanceDays(nextDate, amount);
      break;
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
      return gameSession;
  }

  return updateState(gameSession, {
    ...state,
    time: {
      ...state.time,
      currentDate: nextDate,
      turn: state.time.turn + 1,
      lastUnit: unit,
      lastAmount: amount,
    },
  });
}
