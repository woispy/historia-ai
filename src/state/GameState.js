import {
  createGameTime,
  advanceWeeks,
  advanceMonths,
  advanceYears,
} from "../systems/Time";

/**
 * ============================================================================
 * Historia AI
 * Runtime Game State
 * ============================================================================
 *
 * Stores mutable runtime state.
 *
 * World creation belongs to GameBootstrap.
 */

export function createInitialGameState() {
  return {
    time: createGameTime(),

    player: {},

    timeline: [],

    pendingActions: [],

    settings: {},
  };
}

export function advanceGameTime(
  gameState,
  unit = "week",
  amount = 1
) {
  let nextDate = gameState.time.currentDate;

  switch (unit) {
    case "week":
      nextDate = advanceWeeks(
        nextDate,
        amount
      );
      break;

    case "month":
      nextDate = advanceMonths(
        nextDate,
        amount
      );
      break;

    case "year":
      nextDate = advanceYears(
        nextDate,
        amount
      );
      break;

    default:
      return gameState;
  }

  return {
    ...gameState,

    time: {
      ...gameState.time,

      currentDate: nextDate,

      turn:
        gameState.time.turn + 1,
    },
  };
}