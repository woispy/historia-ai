import { createProvinceModel } from "./ProvinceModel";

/**
 * ============================================================================
 * Province Factory
 * ============================================================================
 */

export function createProvince(rawProvince) {
  if (!rawProvince) {
    throw new Error("Province data is required.");
  }

  if (!rawProvince.id) {
    throw new Error("Province id is required.");
  }

  if (!rawProvince.name) {
    throw new Error("Province name is required.");
  }

  return createProvinceModel({
    id: rawProvince.id,

    name: rawProvince.name,

    region: rawProvince.region,

    terrain: rawProvince.terrain,

    owner: rawProvince.owner,

    controller: rawProvince.controller,

    culture: rawProvince.culture ?? null,

    religion: rawProvince.religion ?? null,

    governor: null,

    population: rawProvince.population,

    development: rawProvince.development,

    cities: rawProvince.city
      ? [rawProvince.city]
      : [],

    roads: [],

    buildings: [],

    characters: [],

    armies: [],

    sea: rawProvince.sea,

    river: rawProvince.river,

    port: rawProvince.port,

    fortLevel: rawProvince.fortLevel,

    status: {
      underSiege: false,
      occupied: false,
      looted: false,
    },
  });
}