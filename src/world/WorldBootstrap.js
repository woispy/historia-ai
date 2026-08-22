import { createMap } from "./map/index.js";
import { bootstrapScenario } from "../scenarios/bootstrap/index.js";
import { createRepositories } from "./RepositoryBootstrap.js";

/**
 * ============================================================================
 * Historia AI
 * World Bootstrap
 * ============================================================================
 */
export async function bootstrapWorld(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  const runtimeScenario = bootstrapScenario(scenario);
  const repositories = await createRepositories(runtimeScenario);
  const map = createMap(repositories.provinces, runtimeScenario.startDate);

  return {
    scenario: runtimeScenario,
    map,
    repositories,
  };
}
