/**
 * ============================================================================
 * Historia AI
 * Family Model
 * ============================================================================
 *
 * Represents a family unit.
 *
 * Relationships are stored separately.
 * This model only represents the family itself.
 */

export function createFamilyModel({
  id,

  name,

  founderCharacterId,

  culture,

  religion,

  createdDate,

  extinct = false,
}) {
  return Object.freeze({
    id,

    name,

    founderCharacterId,

    culture,

    religion,

    createdDate,

    extinct,
  });
}