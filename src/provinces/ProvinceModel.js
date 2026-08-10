/**
 * ============================================================================
 * Historia AI
 * Province Model
 * ============================================================================
 *
 * Represents one Province in the runtime world.
 *
 * Province Models are immutable runtime objects.
 *
 * Runtime Models are created from Province Assets
 * by ProvinceFactory.
 */

export function createProvinceModel({
  /**
   * Identity
   */

  id,

  name,

  /**
   * References
   */

  geometryId = null,

  /**
   * World
   */

  region = null,

  terrain = null,

  /**
   * Politics
   */

  owner = null,

  controller = null,

  governor = null,

  /**
   * Society
   */

  culture = null,

  religion = null,

  population = 0,

  /**
   * Economy
   */

  development = 0,

  /**
   * Runtime Collections
   */

  cities = [],

  roads = [],

  buildings = [],

  characters = [],

  armies = [],

  /**
   * Geography
   */

  sea = false,

  river = false,

  port = false,

  fortLevel = 0,

  /**
   * Runtime Status
   */

  status = {
    underSiege: false,
    occupied: false,
    looted: false,
  },
}) {
  return Object.freeze({
    /**
     * Identity
     */

    id,

    name,

    /**
     * References
     */

    geometryId,

    /**
     * World
     */

    region,

    terrain,

    /**
     * Politics
     */

    owner,

    controller,

    governor,

    /**
     * Society
     */

    culture,

    religion,

    population,

    /**
     * Economy
     */

    development,

    /**
     * Runtime Collections
     */

    cities,

    roads,

    buildings,

    characters,

    armies,

    /**
     * Geography
     */

    sea,

    river,

    port,

    fortLevel,

    /**
     * Runtime Status
     */

    status,
  });
}