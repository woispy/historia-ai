import { addTimelineEvent } from "../../Timeline/index.js";

export function processTimeline(gameSession) {
  const state = gameSession.state;
  const unit = state?.time?.lastUnit ?? "turn";
  return addTimelineEvent(gameSession, {
    category: "system",
    source: "engine",
    key: "time_advanced",
    data: {
      unit,
      turn: state?.time?.turn,
    },
    editable: false,
  });
}
