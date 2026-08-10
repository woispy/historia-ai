import { createGameTime } from "../systems/Time";

function parseStartDate(startDate) {
  if (!startDate) {
    return undefined;
  }

  if (typeof startDate === "object") {
    return startDate;
  }

  const [year, month, day] = String(startDate)
    .split("-")
    .map(Number);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day)
  ) {
    return { year, month, day };
  }

  return undefined;
}

function getPlayerCountry(scenario, player) {
  return scenario?.data?.countries?.[player?.countryId] ?? null;
}

export function createRuntimeState({
  startDate,
  scenario = null,
  player = {},
} = {}) {
  const country = getPlayerCountry(scenario, player);
  const countryEconomy = country?.economy ?? {};
  const countryPopulation = country?.population ?? {};
  const countryMilitary = country?.military ?? {};

  const initialPopulation =
    Number(countryPopulation.total ?? country.population ?? 0) || 0;

  return {
    time: createGameTime(
      parseStartDate(startDate)
    ),

    timeline: [],

    pendingActions: [],

    simulation: {
      treasury:
        Number(countryEconomy.treasury ?? countryEconomy.gold ?? 2500) || 2500,
      prestige:
        Number(country.prestige ?? 40) || 40,
      stability:
        Number(country.stability ?? 70) || 70,
      legitimacy:
        Number(country.legitimacy ?? 65) || 65,
      population: initialPopulation,
      food: Number(countryEconomy.food ?? 70) || 70,
      militaryPower:
        Number(countryMilitary.power ?? countryMilitary.strength ?? 100) || 100,
      technology:
        Number(country.technology ?? 10) || 10,
      income: 0,
      expenses: 0,
      monthlyGrowth: 0,
      lastTurnSummary: "Devlet henüz yeni bir dönem simülasyonu yaşamadı.",
      recentEvents: [],
      relationships: {},
      activeWars: [],
    },
  };
}
