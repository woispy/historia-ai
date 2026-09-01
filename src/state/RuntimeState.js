import { createGameTime } from "../systems/Time/index.js";
import { createWorldState } from "./WorldState.js";

function parseStartDate(startDate) {
  if (!startDate) return undefined;
  if (typeof startDate === "object") return startDate;

  const [year, month, day] = String(startDate).split("-").map(Number);
  if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
    return { year, month, day };
  }

  return undefined;
}

function getPlayerCountry(scenario, player) {
  return scenario?.data?.countries?.[player?.countryId] ?? null;
}

function getStartingPopulation(scenario, player) {
  const country = getPlayerCountry(scenario, player);
  const direct = Number(country?.population?.total ?? country?.population);
  if (direct > 0) return direct;

  return Object.values(scenario?.data?.cities ?? {}).reduce((sum, city) => {
    if (city.owner !== player?.countryId) return sum;
    return sum + (Number(city.population) || 0);
  }, 0);
}

export function createRuntimeState({
  startDate,
  scenario = null,
  player = {},
  world = null,
  randomSeed = null,
} = {}) {
  if (!world) {
    throw new Error("World is required to create canonical runtime state.");
  }

  const country = getPlayerCountry(scenario, player);
  const treasury = Number(country?.economy?.treasury ?? country?.treasury ?? 2500) || 2500;
  const militaryPower = Number(
    country?.military?.power ?? country?.military?.strength ?? country?.manpower ?? 100
  ) || 100;

  const time = createGameTime(parseStartDate(startDate));
  const simulation = {
    treasury,
    prestige: Number(country?.prestige ?? 40) || 40,
    stability: Number(country?.stability ?? 70) || 70,
    legitimacy: Number(country?.legitimacy ?? 65) || 65,
    population: getStartingPopulation(scenario, player),
    food: Number(country?.economy?.food ?? 70) || 70,
    militaryPower,
    technology: Number(country?.technology ?? 10) || 10,
    income: 0,
    expenses: 0,
    monthlyGrowth: 0,
    lastTurnSummary: "Yeni hükümdarlık dönemi başladı.",
    recentEvents: [],
    relationships: {},
    activeWars: [],
  };

  return createWorldState({
    world,
    time,
    scenarioId: scenario?.id ?? null,
    playerCountryId: player?.countryId ?? null,
    playerCharacterId: player?.character?.id ?? null,
    randomSeed: randomSeed ?? `${scenario?.id ?? "scenario"}:${player?.countryId ?? "country"}`,
    simulation,
  });
}
