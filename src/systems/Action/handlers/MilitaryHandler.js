import { addTimelineEvent } from "../../Timeline/index.js";
import { getRuntime, updateRuntime } from "../../../state/index.js";
import { updateCity } from "../../../cities/CityRepository.js";

export function handleMilitaryAction(gameSession, action) {
  const runtime = getRuntime(gameSession);
  const intent = action.interpretation?.intent;
  const cityId = action.interpretation?.entities?.city;
  const city = cityId ? runtime.cities.byId[cityId] : null;

  if (!city) {
    return addTimelineEvent(gameSession, {
      category: "military",
      source: "military-handler",
      key: "military_target_missing",
      data: { text: action.text },
      editable: false,
    });
  }

  if (intent === "military.siege" || intent === "military.attack") {
    const nextCity = {
      ...city,
      status: {
        ...city.status,
        underSiege: true,
        siegeTurns: Number(city.status?.siegeTurns ?? 0),
      },
    };

    const nextRuntime = {
      ...runtime,
      cities: updateCity(runtime.cities, nextCity),
    };

    const nextSession = updateRuntime(gameSession, nextRuntime);

    return addTimelineEvent(nextSession, {
      category: "military",
      source: "military-handler",
      key: intent === "military.attack" ? "attack_started" : "city_under_siege",
      data: { city: cityId, text: action.text },
      editable: false,
    });
  }

  return addTimelineEvent(gameSession, {
    category: "military",
    source: "military-handler",
    key: "player_action_processed",
    data: {
      id: action.id,
      intent,
      entities: action.interpretation?.entities ?? {},
      text: action.text,
    },
    editable: false,
  });
}
