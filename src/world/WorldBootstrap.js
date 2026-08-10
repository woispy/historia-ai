import {
  createMap,
} from "./map/index.js";

import {
  bootstrapScenario,
} from "../scenarios/bootstrap/index.js";

import {
  createRepositories,
} from "./RepositoryBootstrap.js";

/**
 * ============================================================================
 * Historia AI
 * World Bootstrap
 * ============================================================================
 */

export function bootstrapWorld(
  scenario
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  const runtimeScenario =
    bootstrapScenario(
      scenario
    );

  const map =
    createMap();

  const repositories =
    createRepositories(
      runtimeScenario
    );

  return {
    scenario:
      runtimeScenario,

    map,

    repositories,
  };
}