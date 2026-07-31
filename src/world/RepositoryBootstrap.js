import { createCharacterRepository } from "../characters";
import { createFamilyRepository } from "../family";
import { createKnowledgeRepository } from "../knowledge";
import { createSelectionRepository } from "../selection";

/**
 * ============================================================================
 * Repository Bootstrap
 * ============================================================================
 *
 * Creates every runtime repository used by the world.
 */

export function createRepositories(map) {
  return {
    provinces: map.provinces,

    characters: createCharacterRepository(),

    families: createFamilyRepository(),

    knowledge: createKnowledgeRepository(),

    selection: createSelectionRepository(),
  };
}