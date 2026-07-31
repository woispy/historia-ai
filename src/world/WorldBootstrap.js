import { createMap } from "./map";

import { createRepositories } from "./RepositoryBootstrap";

/**
 * ============================================================================
 * World Bootstrap
 * ============================================================================
 *
 * Creates the runtime world.
 */

export function bootstrapWorld(scenario) {
  const map = createMap();

  const repositories = createRepositories(map);

  return {
    map,

    repositories,

    ...scenario.data,
  };
}