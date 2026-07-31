/**
 * ============================================================================
 * Historia AI
 * Character Model
 * ============================================================================
 *
 * Represents a single living person in the world.
 *
 * Every human in Historia AI uses this model.
 *
 * Examples
 * --------
 * - Osman Bey
 * - Orhan Bey
 * - A peasant
 * - A merchant
 * - A soldier
 * - The player character
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

  dynastyId = null,

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

    dynastyId,

    titles,

    traits,

    skills,

    relationships,

    wealth,

    health,

    alive,
  });
}