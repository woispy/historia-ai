import { createGameSession } from "../engine";
import { loadScenario, validateScenario } from "../scenarios";
import { createRuntimeState } from "../state";
import { createWorld } from "../world";

/**
 * ============================================================================
 * Historia AI
 * Game Bootstrap
 * ============================================================================
 *
 * Creates a complete runtime game session.
 *
 * Pipeline
 * --------
 * ScenarioLoader
 *      ↓
 * ScenarioValidator
 *      ↓
 * WorldFactory
 *      ↓
 * RuntimeState
 *      ↓
 * GameSession
 */

export function createGame({
  scenarioId,
  player = {},
  settings = {},
}) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  const scenario = loadScenario(scenarioId);

  const validation = validateScenario(scenario);

  if (!validation.valid) {
    const messages = validation.errors
      .map((error) => error.message)
      .join("\n");

    throw new Error(
      `Scenario validation failed.\n\n${messages}`
    );
  }

  const world = createWorld(scenario);

  const state = createRuntimeState();

  return createGameSession({
    scenario,
    world,
    state,
    player,
    settings,
  });
}