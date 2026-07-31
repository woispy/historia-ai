import { createMap } from "./map";

import { createCharacterRepository } from "../characters";
import { createFamilyRepository } from "../family";
import { createKnowledgeRepository } from "../knowledge";

/**
 * ============================================================================
 * World Factory
 * ============================================================================
 *
 * Creates the runtime world.
 *
 * World owns repositories.
 * Systems read and modify repository data.
 */

export function createWorld(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  return {
    map: createMap(),

    repositories: {
      characters: createCharacterRepository(),

      families: createFamilyRepository(),

      knowledge: createKnowledgeRepository(),
    },

    ...scenario.data,
  };
}