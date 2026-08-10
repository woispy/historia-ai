import { addTimelineEvent } from "../../Timeline";

export function processTimeline(gameSession) {
  const unit = gameSession.runtime?.time?.lastUnit ?? "turn";
  return addTimelineEvent(gameSession, {
    category: "system",
    source: "engine",
    key: "time_advanced",
    data: {
      unit,
      turn: gameSession.runtime?.time?.turn,
    },
    editable: false,
  });
}
