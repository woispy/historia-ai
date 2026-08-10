import { createMap } from "./map/index.js";
import { bootstrapScenario } from "../scenarios/bootstrap/index.js";
import { createRepositories } from "./RepositoryBootstrap.js";

/**
 * ============================================================================
 * Historia AI
 * World Bootstrap
 * ============================================================================
 */
export function bootstrapWorld(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  const runtimeScenario = bootstrapScenario(scenario);
  const repositories = createRepositories(runtimeScenario);
  const map = createMap(repositories.provinces);

  return {
    scenario: runtimeScenario,
    map,
    repositories,
  };
}
