import {
  getRuntime,
  updateRuntime,
} from "../../state";

/**
 * ============================================================================
 * Historia AI
 * Timeline System
 * ============================================================================
 *
 * Adds timeline entries to the current GameSession runtime.
 */

export function addTimelineEvent(
  gameSession,
  event
) {
  const runtime =
    getRuntime(gameSession);

  const timelineEntry = {
    id: crypto.randomUUID(),

    date: {
      ...runtime.time.currentDate,
    },

    category:
      event.category ?? "system",

    source:
      event.source ?? "system",

    key: event.key,

    data:
      event.data ?? {},

    editable:
      event.editable ?? false,
  };

  return updateRuntime(
    gameSession,
    {
      ...runtime,

      timeline: [
        timelineEntry,
        ...runtime.timeline,
      ],
    }
  );
}