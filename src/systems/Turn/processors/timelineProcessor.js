import { addTimelineEvent } from "../../Timeline";

/**
 * Adds timeline entries generated during the current turn.
 */
export function processTimeline(runtime) {
  return addTimelineEvent(runtime, {
    category: "system",
    source: "engine",
    key: "week_passed",
    data: {},
    editable: false,
  });
}