import { createCharacterRepository } from "../characters";
import { createFamilyRepository } from "../family";
import { createKnowledgeRepository } from "../knowledge";
import { createSelectionRepository } from "../selection";

/**
 * ============================================================================
 * Repository Bootstrap
 * ============================================================================
 *
 * Creates every runtime repository.
 *
 * Scenario repositories are injected
 * by ScenarioBootstrap.
 */

export function createRepositories({
  scenarioRepositories,
}) {
  return {
    ...scenarioRepositories,

    characters:
      createCharacterRepository(),

    families:
      createFamilyRepository(),

    knowledge:
      createKnowledgeRepository(),

    selection:
      createSelectionRepository(),
  };
}