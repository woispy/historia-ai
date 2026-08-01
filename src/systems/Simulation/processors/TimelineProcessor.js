import {
  addTimelineEvent,
} from "../../Timeline";

export function processTimeline(
  gameSession
) {
  return addTimelineEvent(
    gameSession,
    {
      category: "system",

      source: "engine",

      key: "week_passed",

      data: {},

      editable: false,
    }
  );
}