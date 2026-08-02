import {
  addTimelineEvent,
} from "../../Timeline";

import {
  setCityUnderSiege,
} from "../../../cities";

/**
 * ============================================================================
 * Historia AI
 * Military Handler
 * ============================================================================
 */

export function handleMilitaryAction(
  gameSession,
  action
) {
  let nextSession = gameSession;

  const intent =
    action.interpretation?.intent;

  const cityId =
    action.interpretation?.entities?.city;

  if (
    intent === "military.siege" &&
    cityId
  ) {
    const world =
      nextSession.world;

    world.repositories.cities =
      setCityUnderSiege(
        world.repositories.cities,
        cityId,
        true
      );

    nextSession =
      addTimelineEvent(nextSession, {
        category: "military",

        source:
          "military-handler",

        key: "city_under_siege",

        data: {
          city: cityId,

          text: action.text,
        },

        editable: false,
      });

    return nextSession;
  }

  return addTimelineEvent(
    nextSession,
    {
      category: "military",

      source:
        "military-handler",

      key:
        "player_action_processed",

      data: {
        id: action.id,

        intent,

        entities:
          action.interpretation
            ?.entities ?? {},

        text: action.text,
      },

      editable: false,
    }
  );
}