import { createRelationshipModel } from "./RelationshipModel";

/**
 * ============================================================================
 * Relationship Factory
 * ============================================================================
 *
 * Creates a validated relationship.
 */

export function createRelationship(data) {
  if (!data) {
    throw new Error("Relationship data is required.");
  }

  if (!data.id) {
    throw new Error("Relationship id is required.");
  }

  if (!data.fromCharacterId) {
    throw new Error("fromCharacterId is required.");
  }

  if (!data.toCharacterId) {
    throw new Error("toCharacterId is required.");
  }

  if (!data.type) {
    throw new Error("Relationship type is required.");
  }

  if (!data.sinceDate) {
    throw new Error("Relationship sinceDate is required.");
  }

  return createRelationshipModel(data);
}