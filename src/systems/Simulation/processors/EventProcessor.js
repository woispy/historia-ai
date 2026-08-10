import { getRuntime, updateRuntime } from "../../../state";
import { addTimelineEvent } from "../../Timeline";

export function processEvents(gameSession) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const recentEvents = [...(simulation.recentEvents ?? [])];
  let nextSession = gameSession;

  const roll = Math.random();

  if (roll < 0.12) {
    const event = {
      key: "market_shift",
      title: "Pazar hareketlendi",
      text: "Bölgedeki ticaretin hareketlenmesi hazine gelirlerini olumlu etkiledi.",
      impact: { treasury: 25, prestige: 1 },
    };

    recentEvents.unshift(event);
    nextSession = updateRuntime(nextSession, {
      ...runtime,
      simulation: {
        ...simulation,
        treasury: Math.max(0, (simulation.treasury ?? 0) + event.impact.treasury),
        prestige: (simulation.prestige ?? 0) + event.impact.prestige,
        recentEvents: recentEvents.slice(0, 8),
      },
    });

    nextSession = addTimelineEvent(nextSession, {
      category: "event",
      source: "event-engine",
      key: event.key,
      data: event,
      editable: false,
    });
  } else {
    nextSession = updateRuntime(nextSession, {
      ...runtime,
      simulation: {
        ...simulation,
        recentEvents: recentEvents.slice(0, 8),
      },
    });
  }

  return nextSession;
}
