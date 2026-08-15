export { KnowledgeTypes } from "./KnowledgeTypes.js";

export { createKnowledge } from "./KnowledgeFactory.js";

export { createKnowledgeModel } from "./KnowledgeModel.js";

export {
  createKnowledgeRepository,
  addKnowledge,
  updateKnowledge,
  removeKnowledge,
} from "./KnowledgeRepository.js";

export {
  getKnowledge,
  getKnowledgeByCharacter,
  getKnowledgeByType,
  getReliableKnowledge,
  getRumors,
} from "./KnowledgeQueries.js";
