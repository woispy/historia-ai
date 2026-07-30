export function addTimelineEvent(gameState, event) {
  const timelineEntry = {
    id: crypto.randomUUID(),

    date: gameState.time.currentDate,

    category: event.category ?? "system",

    source: event.source ?? "system",

    key: event.key,

    data: event.data ?? {},

    editable: event.editable ?? false,
  };

  return {
    ...gameState,

    timeline: [
      timelineEntry,
      ...gameState.timeline,
    ],
  };
}