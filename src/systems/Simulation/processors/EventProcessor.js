import { getState, updateState } from "../../../state/index.js";
import { addTimelineEvent } from "../../Timeline/index.js";
import { nextSimulationRandom } from "../SimulationRandom.js";

export function processEvents(gameSession) {
  const state = getState(gameSession);
  const simulation = state.simulation ?? {};
  const recentEvents = [...(simulation.recentEvents ?? [])];
  const random = nextSimulationRandom(simulation.rngState ?? simulation.simulationSeed ?? 1);
  let nextSession = gameSession;

  if (random.value < 0.12) {
    const event = {
      key: "market_shift",
      title: "Pazar hareketlendi",
      text: "Bölgedeki ticaretin hareketlenmesi hazine gelirlerini olumlu etkiledi.",
      impact: { treasury: 25, prestige: 1 },
    };

    recentEvents.unshift(event);
    nextSession = updateState(nextSession, {
      ...state,
      simulation: {
        ...simulation,
        rngState: random.state,
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
    nextSession = updateState(nextSession, {
      ...state,
      simulation: {
        ...simulation,
        rngState: random.state,
        recentEvents: recentEvents.slice(0, 8),
      },
    });
  }

  return nextSession;
}
