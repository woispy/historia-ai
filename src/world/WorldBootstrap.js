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
 *
 * Creates the runtime world.
 */

export function bootstrapWorld(
  scenario
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  const map = createMap();

  const {
    repositories:
      scenarioRepositories,
  } = bootstrapScenario({
    scenario,
    map,
  });

  const repositories =
    createRepositories({
      scenarioRepositories,
    });

  return {
    map,

    repositories,
  };
}