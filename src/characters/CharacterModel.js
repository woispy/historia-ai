/**
 * ============================================================================
 * Historia AI
 * Character Model
 * ============================================================================
 *
 * Represents a single living person in the world.
 *
 * Every human in Historia AI uses this model.
 */

export function createCharacterModel({
  id,

  firstName,

  lastName = "",

  gender,

  birthDate,

  culture,

  religion,

  location,

  profession = null,

  familyId = null,

  authorityId = "COMMONER",

  titles = [],

  traits = [],

  skills = {},

  relationships = {},

  wealth = 0,

  health = 100,

  alive = true,
}) {
  return Object.freeze({
    id,

    firstName,

    lastName,

    gender,

    birthDate,

    deathDate: null,

    culture,

    religion,

    location,

    profession,

    familyId,

    authorityId,

    titles,

    traits,

    skills,

    relationships,

    wealth,

    health,

    alive,
  });
}