import { addTimelineEvent } from "../../Timeline";

export function handleConstructionAction(gameState, action) {
  return addTimelineEvent(gameState, {
    category: "construction",
    source: "construction-handler",
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