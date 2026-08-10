import { addTimelineEvent } from "../../Timeline";
import { getRuntime, updateRuntime } from "../../../state";
import { updateCity } from "../../../cities/CityRepository";

export function handleConstructionAction(gameSession, action) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const cityId = action.interpretation?.entities?.city;
  const cityRepository = gameSession.world.repositories.cities;
  const city = cityId ? cityRepository.byId[cityId] : null;

  if (!city) {
    return addTimelineEvent(gameSession, {
      category: "construction",
      source: "construction-handler",
      key: "construction_target_missing",
      data: { id: action.id, text: action.text },
      editable: false,
    });
  }

  const cost = 180;
  if ((simulation.treasury ?? 0) < cost) {
    return addTimelineEvent(gameSession, {
      category: "construction",
      source: "construction-handler",
      key: "construction_failed_funds",
      data: { city: cityId, cost, treasury: simulation.treasury ?? 0 },
      editable: false,
    });
  }

  const nextCityRepository = updateCity(cityRepository, {
    ...city,
    prosperity: Math.min(100, Number(city.prosperity ?? 0) + 5),
    buildings: [
      ...(city.buildings ?? []),
      { id: crypto.randomUUID(), type: "infrastructure", level: 1 },
    ],
  });

  const nextSession = updateRuntime(
    {
      ...gameSession,
      world: {
        ...gameSession.world,
        repositories: {
          ...gameSession.world.repositories,
          cities: nextCityRepository,
        },
      },
    },
    {
      ...runtime,
      simulation: {
        ...simulation,
        treasury: simulation.treasury - cost,
        lastTurnSummary: `${city.name} şehrinde yeni bir yapı inşa edildi.`,
      },
    }
  );

  return addTimelineEvent(nextSession, {
    category: "construction",
    source: "construction-handler",
    key: "building_constructed",
    data: { city: cityId, cost },
    editable: false,
  });
}
