import { getState, updateState } from "../../../state/index.js";
import { updateCity } from "../../../cities/CityRepository.js";
import { addTimelineEvent } from "../../Timeline/index.js";

export function processMilitary(gameSession) {
  const state = getState(gameSession);
  const simulation = state.simulation ?? {};
  const cityRepository = state.cities;
  let nextCities = cityRepository;
  const activeSieges = [];
  const resolvedSieges = [];
  const playerCountryId = state.playerCountryId ?? gameSession.player?.countryId;

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

  let nextSession = updateState(gameSession, {
    ...state,
    cities: nextCities,
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
