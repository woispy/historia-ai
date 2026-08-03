import { createMap } from "./map";

import {
  bootstrapScenario,
} from "../scenarios/bootstrap";

import {
  createRepositories,
} from "./RepositoryBootstrap";

/**
 * ============================================================================
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