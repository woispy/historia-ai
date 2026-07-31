export { KnowledgeTypes } from "./KnowledgeTypes";

export { createKnowledge } from "./KnowledgeFactory";

export { createKnowledgeModel } from "./KnowledgeModel";

export {
  createKnowledgeRepository,
  addKnowledge,
  updateKnowledge,
  removeKnowledge,
} from "./KnowledgeRepository";

export {
  getKnowledge,
  getKnowledgeByCharacter,
  getKnowledgeByType,
  getReliableKnowledge,
  getRumors,
} from "./KnowledgeQueries";