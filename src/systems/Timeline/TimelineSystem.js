import {
  getState,
  updateState,
} from "../../state/index.js";

/**
 * ============================================================================
 * Historia AI
 * Timeline System
 * ============================================================================
 *
 * Adds timeline entries to GameSession state.
 *
 * Timeline IDs are derived from simulation state rather than wall-clock or
 * random identity sources so deterministic simulation replays produce the
 * same serialized timeline.
 */

function createDeterministicTimelineId(state, event) {
  const date = state?.time?.currentDate ?? {};
  const turn = Number.isInteger(state?.time?.turn)
    ? state.time.turn
    : 0;
  const sequence = Array.isArray(state?.timeline)
    ? state.timeline.length + 1
    : 1;
  const key = String(event.key ?? "event")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";

  return [
    "timeline",
    date.year ?? 0,
    date.month ?? 0,
    date.day ?? 0,
    turn,
    sequence,
    key,
  ].join("-");
}

export function addTimelineEvent(gameSession, event) {
  const state = getState(gameSession);

  const timelineEntry = {
    id: createDeterministicTimelineId(state, event),
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
