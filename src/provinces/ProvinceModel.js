/**
 * ============================================================================
 * Historia AI
 * Province Model
 * ============================================================================
 *
 * Represents one province in the game world.
 *
 * Province models are immutable.
 */

export function createProvinceModel({
  id,

  name,

  region,

  terrain,

  owner,

  controller,

  culture = null,

  religion = null,

  governor = null,

  population = 0,

  development = 0,

  cities = [],

  roads = [],

  buildings = [],

  characters = [],

  armies = [],

  sea = false,

  river = false,

  port = false,

  fortLevel = 0,

  status = {
    underSiege: false,
    occupied: false,
    looted: false,
  },
}) {
  return Object.freeze({
    id,

    name,

    region,

    terrain,

    owner,

    controller,

    culture,

    religion,

    governor,

    population,

    development,

    cities,

    roads,

    buildings,

    characters,

    armies,

    sea,

    river,

    port,

    fortLevel,

    status,
  });
}