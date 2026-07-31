/**
 * ============================================================================
 * Relationship Queries
 * ============================================================================
 */

export function getRelationships(world) {
  return world.relationships ?? [];
}

export function getCharacterRelationships(
  world,
  characterId
) {
  return getRelationships(world).filter(
    (relationship) =>
      relationship.fromCharacterId === characterId ||
      relationship.toCharacterId === characterId
  );
}

export function getRelationshipsByType(
  world,
  characterId,
  type
) {
  return getCharacterRelationships(
    world,
    characterId
  ).filter(
    (relationship) => relationship.type === type
  );
}