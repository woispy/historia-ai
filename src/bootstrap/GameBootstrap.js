import { createGameSession } from "../engine";

import {
  loadScenario,
  validateScenario,
} from "../scenarios";

import {
  createRuntimeState,
} from "../state";

import {
  bootstrapWorld,
} from "../world";

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

    throw new Error(`Scenario validation failed.\n\n${messages}`);
  }

  const world = bootstrapWorld(scenario);
  const runtime = createRuntimeState({
    startDate: scenario.startDate,
    scenario,
    player,
  });

  return createGameSession({
    scenario,
    world,
    runtime,
    player,
    settings,
  });
}
