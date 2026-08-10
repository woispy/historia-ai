import {
  createProvinceModel,
} from "./ProvinceModel.js";

/**
 * ============================================================================
 * Historia AI
 * Province Factory
 * ============================================================================
 *
 * Converts immutable Province Assets into
 * runtime Province Models.
 */

export function createProvince(
  asset
) {
  if (!asset) {
    throw new Error(
      "Province Asset is required."
    );
  }

  if (!asset.identity) {
    throw new Error(
      "Province Asset identity is required."
    );
  }

  if (!asset.references) {
    throw new Error(
      "Province Asset references are required."
    );
  }

  const {
    identity,
    references,
    ownership = {},
    administration = {},
    culture = {},
    religion = {},
    population = {},
    economy = {},
  } = asset;

  if (!identity.id) {
    throw new Error(
      "Province Asset ID is required."
    );
  }

  if (!identity.name) {
    throw new Error(
      "Province Asset name is required."
    );
  }

  return createProvinceModel({
    /**
     * Identity
     */

    id:
      identity.id,

    name:
      identity.name,

    /**
     * Geometry
     */

    geometryId:
      references.geometryId,

    /**
     * World
     */

    region:
      null,

    terrain:
      null,

    /**
     * Politics
     */

    owner:
      ownership.countryId ??
      null,

    controller:
      ownership.ownerId ??
      null,

    governor:
      administration.governorId ??
      null,

    /**
     * Culture
     */

    culture:
      culture.primaryCulture ??
      null,

    religion:
      religion.primaryReligion ??
      null,

    /**
     * Population
     */

    population:
      population.total ??
      0,

    /**
     * Economy
     */

    development:
      economy.development ??
      0,

    /**
     * Runtime Collections
     */

    cities: [],

    roads: [],

    buildings: [],

    characters: [],

    armies: [],

    /**
     * Geography
     */

    sea: false,

    river: false,

    port: false,

    fortLevel: 0,

    /**
     * Runtime Status
     */

    status: {
      underSiege: false,
      occupied: false,
      looted: false,
    },
  });
}