import { createCountryRepositoryFromArray } from "../countries/index.js";
import { createCityRepositoryFromArray } from "../cities/index.js";
import { loadHistoricalProvinceRepository } from "../provinces/index.js";
import { createCharacterRepository } from "../characters/index.js";
import { createFamilyRepository } from "../family/index.js";
import { createKnowledgeRepository } from "../knowledge/index.js";
import { createSelectionRepository } from "../selection/index.js";
import { ANATOLIA_CITY_ATLAS } from "../map/data/AnatoliaCityAtlas.js";

function getHistoricalRegistry(scenario) {
  return Object.values(scenario.data.historical ?? {})[0] ?? null;
}

function mergeHistoricalCityAtlas(scenarioCities, provinceRepository) {
  const merged = { ...scenarioCities };

  for (const [cityId, atlas] of Object.entries(ANATOLIA_CITY_ATLAS)) {
    if (merged[cityId]) continue;

    const province = atlas.mapProvinceId
      ? provinceRepository.byId[atlas.mapProvinceId]
      : null;

    merged[cityId] = {
      id: cityId,
      name: atlas.name,
      owner: province?.owner ?? null,
      province: atlas.mapProvinceId,
      population: 0,
      prosperity: 0,
      food: 50,
      loyalty: 50,
      buildings: [],
      garrison: [],
      status: { underSiege: false, looted: false, occupied: false },
      map: atlas,
    };
  }

  return merged;
}

export function createRepositories(scenario) {
  if (!scenario) throw new Error("Scenario is required.");

  const historicalRegistry = getHistoricalRegistry(scenario);
  const scenarioCountries = Object.values(scenario.data.countries ?? {});
  const historicalCountries = Object.values(historicalRegistry?.countries ?? {});
  const countriesById = {};

  for (const country of historicalCountries) {
    countriesById[country.id] = country;
  }

  for (const country of scenarioCountries) {
    countriesById[country.id] = {
      ...(countriesById[country.id] ?? {}),
      ...country,
    };
  }

  const provinces = loadHistoricalProvinceRepository(historicalRegistry);
  const scenarioCities = mergeHistoricalCityAtlas(
    scenario.data.cities ?? {},
    provinces,
  );

  return {
    countries: createCountryRepositoryFromArray(Object.values(countriesById)),
    cities: createCityRepositoryFromArray(Object.values(scenarioCities)),
    provinces,
    historicalProvinces: provinces,
    characters: createCharacterRepository(),
    families: createFamilyRepository(),
    knowledge: createKnowledgeRepository(),
    selection: createSelectionRepository(),
  };
}
