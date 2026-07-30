import { addTimelineEvent } from "../../Timeline";

export function processTimeline(gameState) {
  return addTimelineEvent(gameState, {
    category: "system",
    source: "engine",
    key: "week_passed",
    data: {},
    editable: false,
  });
}