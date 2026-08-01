import {
  simulateTurn,
} from "../Simulation";

/**
 * ============================================================================
 * Historia AI
 * Turn Engine
 * ============================================================================
 *
 * The Turn Engine is responsible for executing one game turn.
 *
 * It coordinates the Simulation Engine.
 */

export function processTurn(
  gameSession,
  unit = "week",
  amount = 1
) {
  return simulateTurn(
    gameSession,
    unit,
    amount
  );
}