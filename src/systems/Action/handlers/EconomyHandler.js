import { addTimelineEvent } from "../../Timeline/index.js";
import { getRuntime, updateRuntime } from "../../../state/index.js";

export function handleEconomyAction(gameSession, action) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const nextSession = updateRuntime(gameSession, {
    ...runtime,
    simulation: {
      ...simulation,
      treasury: Math.max(0, (simulation.treasury ?? 0) + 120),
      stability: Math.max(0, (simulation.stability ?? 70) - 2),
      lastTurnSummary: "Vergi toplandı; hazine güçlendi fakat halk üzerindeki baskı arttı.",
    },
  });

  return addTimelineEvent(nextSession, {
    category: "economy",
    source: "economy-handler",
    key: "tax_collected",
    data: {
      id: action.id,
      amount: 120,
      intent: action.interpretation?.intent,
      text: action.text,
    },
    editable: false,
  });
}
