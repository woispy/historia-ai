import { createCities } from "./cities";
import { createCountries } from "./countries";
import { createArmies } from "./armies";
import { createDiplomacy } from "./diplomacy";

export function createWorld() {
  return {
    cities: createCities(),

    countries: createCountries(),

    armies: createArmies(),

    diplomacy: createDiplomacy(),
  };
}