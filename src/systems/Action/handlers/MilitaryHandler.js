import { addTimelineEvent } from "../../Timeline";
import { setCityUnderSiege } from "../../../world";

export function handleMilitaryAction(gameState, action) {
  let nextState = gameState;

  const intent = action.interpretation?.intent;
  const cityId = action.interpretation?.entities?.city;

  if (intent === "military.siege" && cityId) {
    nextState = setCityUnderSiege(nextState, cityId, true);

    nextState = addTimelineEvent(nextState, {
      category: "military",
      source: "military-handler",
      key: "city_under_siege",
      data: {
        city: cityId,
        text: action.text,
      },
      editable: false,
    });

    return nextState;
  }

  return addTimelineEvent(nextState, {
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