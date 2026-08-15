import {
  getState,
  updateState,
} from "../../state";

/**
 * ============================================================================
 * Historia AI
 * Timeline System
 * ============================================================================
 *
 * Adds timeline entries to GameSession state.
 */

export function addTimelineEvent(gameSession, event) {
  const state = getState(gameSession);

  const timelineEntry = {
    id: crypto.randomUUID(),
    date: {
      ...state.time.currentDate,
    },
    category: event.category ?? "system",
    source: event.source ?? "system",
    key: event.key,
    data: event.data ?? {},
    editable: event.editable ?? false,
  };

  return updateState(gameSession, {
    ...state,
    timeline: [
      timelineEntry,
      ...state.timeline,
    ],
  });
}
