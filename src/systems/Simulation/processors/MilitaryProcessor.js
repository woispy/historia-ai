import { getRuntime, updateRuntime } from "../../../state";
import { updateCity } from "../../../cities/CityRepository";
import { addTimelineEvent } from "../../Timeline";

export function processMilitary(gameSession) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const cityRepository = gameSession.world.repositories.cities;
  let nextCities = cityRepository;
  const activeSieges = [];

  for (const city of Object.values(cityRepository.byId)) {
    if (!city.status?.underSiege) continue;

    activeSieges.push(city.id);
    const nextFood = Math.max(0, Number(city.food ?? 50) - 2);
    const nextProsperity = Math.max(0, Number(city.prosperity ?? 50) - 1);
    const nextLoyalty = Math.max(0, Number(city.loyalty ?? 50) - 0.5);

    nextCities = updateCity(nextCities, {
      ...city,
      food: nextFood,
      prosperity: nextProsperity,
      loyalty: nextLoyalty,
    });
  }

  let nextSession = {
    ...gameSession,
    world: {
      ...gameSession.world,
      repositories: {
        ...gameSession.world.repositories,
        cities: nextCities,
      },
    },
  };

  nextSession = updateRuntime(nextSession, {
    ...runtime,
    simulation: {
      ...simulation,
      activeWars: simulation.activeWars ?? [],
    },
  });

  if (activeSieges.length > 0) {
    nextSession = addTimelineEvent(nextSession, {
      category: "military",
      source: "military-engine",
      key: "siege_progress",
      data: { cities: activeSieges },
      editable: false,
    });
  }

  return nextSession;
}
