import { createCountryRepositoryFromArray } from "../countries";
import { createCityRepositoryFromArray } from "../cities";
import { loadHistoricalProvinceRepository } from "../provinces";
import { createCharacterRepository } from "../characters";
import { createFamilyRepository } from "../family";
import { createKnowledgeRepository } from "../knowledge";
import { createSelectionRepository } from "../selection";
import { ANATOLIA_CITY_ATLAS } from "../map/data/AnatoliaCityAtlas";

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
