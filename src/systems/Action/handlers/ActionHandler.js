import {
  handleMilitaryAction,
  handleEconomyAction,
  handleDiplomacyAction,
  handleConstructionAction,
} from "./index";

import { addTimelineEvent } from "../../Timeline";

/**
 * Dispatches a player action to the appropriate handler.
 *
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function handleAction(runtime, action) {
  const intent = action.interpretation?.intent ?? "";

  if (intent.startsWith("military.")) {
    return handleMilitaryAction(runtime, action);
  }

  if (intent.startsWith("economy.")) {
    return handleEconomyAction(runtime, action);
  }

  if (intent.startsWith("diplomacy.")) {
    return handleDiplomacyAction(runtime, action);
  }

  if (intent.startsWith("construction.")) {
    return handleConstructionAction(runtime, action);
  }

  return addTimelineEvent(runtime, {
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