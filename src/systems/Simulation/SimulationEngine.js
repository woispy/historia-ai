import {
  processTime,
  processActions,
  processEconomy,
  processPopulation,
  processDiplomacy,
  processMilitary,
  processEvents,
  processTimeline,
} from "./processors";

/**
 * ============================================================================
 * Historia AI
 * Simulation Engine
 * ============================================================================
 *
 * Executes every simulation processor for a single turn.
 *
 * The Simulation Engine never decides WHEN a turn happens.
 * It only simulates the world.
 */

export function simulateTurn(
  gameSession,
  unit = "week",
  amount = 1
) {
  let nextSession = gameSession;

  nextSession = processTime(
    nextSession,
    unit,
    amount
  );

  nextSession =
    processActions(nextSession);

  nextSession =
    processEconomy(nextSession);

  nextSession =
    processPopulation(nextSession);

  nextSession =
    processDiplomacy(nextSession);

  nextSession =
    processMilitary(nextSession);

  nextSession =
    processEvents(nextSession);

  nextSession =
    processTimeline(nextSession);

  return nextSession;
}