/**
 * ============================================================================
 * Historia AI
 * Scenario Bootstrap
 * ============================================================================
 */

import {
  bootstrapRepositories,
} from "./ScenarioRepositoryBootstrap";

export function bootstrapScenario({
  scenario,
  map,
}) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  return Object.freeze({
    repositories:
      bootstrapRepositories(
        scenario,
        map
      ),
  });
}