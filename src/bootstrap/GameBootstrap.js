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

function runBootstrapStage(stage, callback) {
  try {
    return callback();
  } catch (error) {
    const detail = error instanceof Error
      ? error.message
      : String(error);

    throw new Error(
      `Game bootstrap failed during ${stage}.\n\n${detail}`,
      { cause: error },
    );
  }
}

export function createGame({
  scenarioId,
  player = {},
  settings = {},
}) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  const scenario = runBootstrapStage("scenario loading", () =>
    loadScenario(scenarioId)
  );

  const validation = runBootstrapStage("scenario validation", () =>
    validateScenario(scenario)
  );

  if (!validation.valid) {
    const messages = validation.errors
      .map((error) => error.message)
      .join("\n");

    throw new Error(`Scenario validation failed.\n\n${messages}`);
  }

  const world = runBootstrapStage("world bootstrap", () =>
    bootstrapWorld(scenario)
  );

  const state = runBootstrapStage("runtime state creation", () =>
    createRuntimeState({
      startDate: scenario.startDate,
      scenario,
      player,
    })
  );

  return runBootstrapStage("game session creation", () =>
    createGameSession({
      scenario,
      world,
      state,
      player,
      settings,
    })
  );
}
