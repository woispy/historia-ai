import { addTimelineEvent } from "../../Timeline";

export function handleEconomyAction(gameState, action) {
  return addTimelineEvent(gameState, {
    category: "economy",
    source: "economy-handler",
    key: "player_action_processed",
    data: {
      id: action.id,
      intent: action.interpretation?.intent,
      entities: action.interpretation?.entities ?? {},
      text: action.text,
    },
    editable: false,
  });
}