import {
  getRuntimeState,
  updateRuntimeState,
} from "../../../state/runtime";

/**
 * Creates engine notifications after each processed turn.
 *
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processNotifications(runtime) {
  const state = getRuntimeState(runtime);

  const timelineEntry = {
    id: state.time.turn,

    date: {
      ...state.time.currentDate,
    },

    category: "system",

    source: "engine",

    key: "week_passed",

    data: {},

    editable: false,
  };

  return updateRuntimeState(runtime, {
    ...state,

    timeline: [
      ...state.timeline,
      timelineEntry,
    ],
  });
}