/**
 * ============================================================================
 * Historia AI
 * Relationship Model
 * ============================================================================
 *
 * Represents a single directed relationship between two characters.
 */

export function createRelationshipModel({
  id,

  fromCharacterId,

  toCharacterId,

  type,

  sinceDate,

  endedDate = null,

  active = true,
}) {
  return Object.freeze({
    id,

    fromCharacterId,

    toCharacterId,

    type,

    sinceDate,

    endedDate,

    active,
  });
}