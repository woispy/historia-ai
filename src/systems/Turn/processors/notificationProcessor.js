export function processNotifications(gameState) {
  const timelineEntry = {
    id: gameState.time.turn,

    date: { ...gameState.time.currentDate },

    category: "system",

    source: "engine",

    key: "week_passed",

    data: {},

    editable: false,
  };

  return {
    ...gameState,

    timeline: [
      ...gameState.timeline,
      timelineEntry,
    ],
  };
}