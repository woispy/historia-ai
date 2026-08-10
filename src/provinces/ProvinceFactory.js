import { createProvinceModel } from "./ProvinceModel.js";

export function createProvince(asset) {
  if (!asset) throw new Error("Province Asset is required.");
  if (!asset.identity) throw new Error("Province Asset identity is required.");
  if (!asset.references) throw new Error("Province Asset references are required.");

  const {
    identity,
    references,
    ownership = {},
    administration = {},
    culture = {},
    religion = {},
    population = {},
    economy = {},
    military = {},
    historical = {},
  } = asset;

  if (!identity.id) throw new Error("Province Asset ID is required.");
  if (!identity.name) throw new Error("Province Asset name is required.");

  return createProvinceModel({
    id: identity.id,
    name: identity.name,
    geometryId: references.geometryId,
    owner: ownership.countryId ?? null,
    controller: ownership.ownerId ?? null,
    governor: administration.governorId ?? null,
    culture: culture.primaryCulture ?? null,
    religion: religion.primaryReligion ?? null,
    population: population.total ?? 0,
    development: economy.development ?? 0,
    wealth: economy.wealth ?? 0,
    supplyLimit: military.supplyLimit ?? 0,
    historical: Object.freeze({ ...historical }),
    historicalDate: asset.header?.historicalDate ?? null,
    historicalSource: asset.header?.provider ?? null,
    cities: [],
    roads: [],
    buildings: [],
    characters: [],
    armies: [],
    sea: false,
    river: false,
    port: false,
    fortLevel: 0,
    status: {
      underSiege: false,
      occupied: false,
      looted: false,
    },
  });
}
