import {
  getRuntime,
  updateRuntime,
} from "../../../state";

/**
 * ============================================================================
 * Notification Processor
 * ============================================================================
 *
 * Creates engine notifications after each processed turn.
 *
 * Works only with the GameSession runtime model.
 */

export function processNotifications(
  gameSession
) {
  const runtime =
    getRuntime(gameSession);

  const timelineEntry = {
    id: runtime.time.turn,

    date: {
      ...runtime.time.currentDate,
    },

    category: "system",

    source: "engine",

    key: "week_passed",

    data: {},

    editable: false,
  };

  return updateRuntime(
    gameSession,
    {
      ...runtime,

      timeline: [
        ...runtime.timeline,
        timelineEntry,
      ],
    }
  );
}