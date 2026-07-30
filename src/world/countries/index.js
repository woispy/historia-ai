import { createOttomans } from "./ottomans";
import { createByzantium } from "./byzantium";
import { createKarasi } from "./karasi";
import { createGermiyan } from "./germiyan";
import { createCandar } from "./candar";

export function createCountries() {
  const countries = [
    createOttomans(),
    createByzantium(),
    createKarasi(),
    createGermiyan(),
    createCandar(),
  ];

  return {
    byId: countries.reduce((result, country) => {
      result[country.id] = country;
      return result;
    }, {}),

    allIds: countries.map((country) => country.id),
  };
}