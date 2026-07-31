import {
  getRuntimeState,
  updateRuntimeState,
} from "../../state/runtime";

/**
 * Adds a new event to the timeline.
 *
 * Supports both the legacy GameState and the new GameSession.
 */
export function addTimelineEvent(runtime, event) {
  const state = getRuntimeState(runtime);

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

  return updateRuntimeState(runtime, {
    ...state,

    timeline: [
      timelineEntry,
      ...state.timeline,
    ],
  });
}