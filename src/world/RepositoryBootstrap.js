import { createCountryRepositoryFromArray } from "../countries";
import { createCityRepositoryFromArray } from "../cities";
import { loadHistoricalProvinceRepository } from "../provinces";
import { createCharacterRepository } from "../characters";
import { createFamilyRepository } from "../family";
import { createKnowledgeRepository } from "../knowledge";
import { createSelectionRepository } from "../selection";

function getHistoricalRegistry(scenario) {
  return Object.values(scenario.data.historical ?? {})[0] ?? null;
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

  return {
    countries: createCountryRepositoryFromArray(Object.values(countriesById)),
    cities: createCityRepositoryFromArray(Object.values(scenario.data.cities ?? {})),
    provinces,
    historicalProvinces: provinces,
    characters: createCharacterRepository(),
    families: createFamilyRepository(),
    knowledge: createKnowledgeRepository(),
    selection: createSelectionRepository(),
  };
}
