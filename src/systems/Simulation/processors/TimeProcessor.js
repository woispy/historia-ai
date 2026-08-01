import {
  advanceWeeks,
  advanceMonths,
  advanceYears,
} from "../../Time";

import {
  getRuntime,
  updateRuntime,
} from "../../../state";

/**
 * ============================================================================
 * Time Processor
 * ============================================================================
 *
 * Advances the simulation clock.
 *
 * Works only with the GameSession runtime model.
 */

export function processTime(
  gameSession,
  unit = "week",
  amount = 1
) {
  const runtime =
    getRuntime(gameSession);

  let nextDate =
    runtime.time.currentDate;

  switch (unit) {
    case "week":
      nextDate =
        advanceWeeks(
          nextDate,
          amount
        );
      break;

    case "month":
      nextDate =
        advanceMonths(
          nextDate,
          amount
        );
      break;

    case "year":
      nextDate =
        advanceYears(
          nextDate,
          amount
        );
      break;

    default:
      return gameSession;
  }

  return updateRuntime(
    gameSession,
    {
      ...runtime,

      time: {
        ...runtime.time,

        currentDate:
          nextDate,

        turn:
          runtime.time.turn + 1,
      },
    }
  );
}