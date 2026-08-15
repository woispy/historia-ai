import { addTimelineEvent } from "../../Timeline/index.js";
import { getRuntime, updateRuntime } from "../../../state/index.js";

export function handleDiplomacyAction(gameSession, action) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const countryId = action.interpretation?.entities?.country ?? "byzantium";
  const relationships = { ...(simulation.relationships ?? {}) };
  relationships[countryId] = Math.min(
    100,
    Number(relationships[countryId] ?? 0) + 8
  );

  const nextSession = updateRuntime(gameSession, {
    ...runtime,
    simulation: {
      ...simulation,
      relationships,
      treasury: Math.max(0, (simulation.treasury ?? 0) - 20),
      lastTurnSummary: `${countryId} ile diplomatik temas kuruldu.`,
    },
  });

  return addTimelineEvent(nextSession, {
    category: "diplomacy",
    source: "diplomacy-handler",
    key: "envoy_sent",
    data: {
      id: action.id,
      country: countryId,
      relation: relationships[countryId],
      text: action.text,
    },
    editable: false,
  });
}
