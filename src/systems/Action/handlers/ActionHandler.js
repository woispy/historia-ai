import {
  handleMilitaryAction,
  handleEconomyAction,
  handleDiplomacyAction,
  handleConstructionAction,
} from "./index";

import { addTimelineEvent } from "../../Timeline";

export function handleAction(gameState, action) {
  const intent = action.interpretation?.intent ?? "";

  if (intent.startsWith("military.")) {
    return handleMilitaryAction(gameState, action);
  }

  if (intent.startsWith("economy.")) {
    return handleEconomyAction(gameState, action);
  }

  if (intent.startsWith("diplomacy.")) {
    return handleDiplomacyAction(gameState, action);
  }

  if (intent.startsWith("construction.")) {
    return handleConstructionAction(gameState, action);
  }

  return addTimelineEvent(gameState, {
    category: "player",
    source: "action-handler",
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