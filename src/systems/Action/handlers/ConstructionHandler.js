import { addTimelineEvent } from "../../Timeline/index.js";
import { getRuntime, updateRuntime } from "../../../state/index.js";
import { updateCity } from "../../../cities/CityRepository.js";

export function handleConstructionAction(gameSession, action) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const cityId = action.interpretation?.entities?.city;
  const city = cityId ? runtime.cities.byId[cityId] : null;

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

  const nextCity = {
    ...city,
    prosperity: Math.min(100, Number(city.prosperity ?? 0) + 5),
    buildings: [
      ...(city.buildings ?? []),
      { id: crypto.randomUUID(), type: "infrastructure", level: 1 },
    ],
  };

  const nextRuntime = {
    ...runtime,
    cities: updateCity(runtime.cities, nextCity),
    simulation: {
      ...simulation,
      treasury: simulation.treasury - cost,
      lastTurnSummary: `${city.name} şehrinde yeni bir yapı inşa edildi.`,
    },
  };

  const nextSession = updateRuntime(gameSession, nextRuntime);

  return addTimelineEvent(nextSession, {
    category: "construction",
    source: "construction-handler",
    key: "building_constructed",
    data: { city: cityId, cost },
    editable: false,
  });
}
