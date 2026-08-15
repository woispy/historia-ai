import {
  getState,
  updateState,
} from "../../../state";

/**
 * ============================================================================
 * Notification Processor
 * ============================================================================
 *
 * Creates engine notifications after each processed turn.
 */

export function processNotifications(gameSession) {
  const state = getState(gameSession);

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

  return updateState(gameSession, {
    ...state,
    timeline: [
      ...state.timeline,
      timelineEntry,
    ],
  });
}
