import { getState, updateState } from "../../../state/index.js";
import { updateCity } from "../../../cities/CityRepository.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMonths(unit, amount) {
  switch (unit) {
    case "day":
      return amount / 30;
    case "week":
      return amount / 4;
    case "month":
      return amount;
    case "year":
      return amount * 12;
    default:
      return 1;
  }
}

export function processPopulation(gameSession) {
  const state = getState(gameSession);
  const simulation = state.simulation ?? {};
  const cityRepository = gameSession.world.repositories.cities;
  const elapsedMonths = Math.max(
    0,
    normalizeMonths(state.time.lastUnit ?? "week", Number(state.time.lastAmount ?? 1))
  );
  const growthPeriods = Math.max(elapsedMonths, 1 / 30);
  let nextCities = cityRepository;
  let totalPopulation = 0;

  for (const city of Object.values(cityRepository.byId)) {
    const food = Number(city.food ?? 50);
    const prosperity = Number(city.prosperity ?? 50);
    const loyalty = Number(city.loyalty ?? 50);
    const pressure =
      (food - 50) * 0.0004 +
      (prosperity - 50) * 0.0002 +
      (loyalty - 50) * 0.0001;
    const monthlyGrowthRate = clamp(0.002 + pressure, -0.01, 0.012);
    const population = Math.max(
      100,
      Math.round(Number(city.population ?? 0) * (1 + monthlyGrowthRate) ** growthPeriods)
    );
    const nextFood = clamp(
      food - (population / 250000) * growthPeriods,
      0,
      100
    );

    nextCities = updateCity(nextCities, {
      ...city,
      population,
      food: Number(nextFood.toFixed(2)),
    });

    totalPopulation += population;
  }

  const nextSession = {
    ...gameSession,
    world: {
      ...gameSession.world,
      repositories: {
        ...gameSession.world.repositories,
        cities: nextCities,
      },
    },
  };

  return updateState(nextSession, {
    ...state,
    simulation: {
      ...simulation,
      population: totalPopulation,
      monthlyGrowth:
        totalPopulation - (simulation.population ?? totalPopulation),
    },
  });
}
