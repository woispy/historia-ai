import { createGameSession } from "../engine/index.js";

import {
  loadScenario,
  validateScenario,
} from "../scenarios/index.js";

import {
  createRuntimeState,
} from "../state/index.js";

import {
  bootstrapWorld,
} from "../world/index.js";

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
  const state = createRuntimeState({
    startDate: scenario.startDate,
    scenario,
    player,
  });

  return createGameSession({
    scenario,
    world,
    state,
    player,
    settings,
  });
}
