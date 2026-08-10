import { getRuntime, updateRuntime } from "../../../state";
import { updateCity } from "../../../cities/CityRepository";
import { addTimelineEvent } from "../../Timeline";

export function processMilitary(gameSession) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const cityRepository = gameSession.world.repositories.cities;
  let nextCities = cityRepository;
  const activeSieges = [];
  const resolvedSieges = [];
  const playerCountryId = gameSession.player?.countryId;

  for (const city of Object.values(cityRepository.byId)) {
    if (!city.status?.underSiege) continue;

    const siegeTurns = Number(city.status?.siegeTurns ?? 0) + 1;
    const nextFood = Math.max(0, Number(city.food ?? 50) - 2);
    const nextProsperity = Math.max(0, Number(city.prosperity ?? 50) - 1);
    const nextLoyalty = Math.max(0, Number(city.loyalty ?? 50) - 0.5);
    const captured = siegeTurns >= 8 && nextFood <= 25;

    if (captured) {
      resolvedSieges.push(city.id);
    } else {
      activeSieges.push(city.id);
    }

    nextCities = updateCity(nextCities, {
      ...city,
      owner: captured ? playerCountryId ?? city.owner : city.owner,
      food: nextFood,
      prosperity: nextProsperity,
      loyalty: nextLoyalty,
      status: {
        ...city.status,
        underSiege: !captured,
        siegeTurns: captured ? 0 : siegeTurns,
        occupied: captured || city.status?.occupied,
      },
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

  for (const cityId of resolvedSieges) {
    nextSession = addTimelineEvent(nextSession, {
      category: "military",
      source: "military-engine",
      key: "city_captured",
      data: { city: cityId, owner: playerCountryId },
      editable: false,
    });
  }

  return nextSession;
}
