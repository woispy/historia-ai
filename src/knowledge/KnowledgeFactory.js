import { createKnowledgeModel } from "./KnowledgeModel";

export function createKnowledge(data) {

  if (!data) {
    throw new Error("Knowledge data is required.");
  }

  if (!data.id) {
    throw new Error("Knowledge id is required.");
  }

  if (!data.ownerCharacterId) {
    throw new Error("ownerCharacterId is required.");
  }

  if (!data.subjectId) {
    throw new Error("subjectId is required.");
  }

  if (!data.subjectType) {
    throw new Error("subjectType is required.");
  }

  if (data.confidence == null) {
    throw new Error("confidence is required.");
  }

  if (!data.source) {
    throw new Error("source is required.");
  }

  if (!data.discoveredDate) {
    throw new Error("discoveredDate is required.");
  }

  return createKnowledgeModel(data);

}