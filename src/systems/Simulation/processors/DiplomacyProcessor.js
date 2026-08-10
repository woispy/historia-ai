import { getRuntime, updateRuntime } from "../../../state";
import { addTimelineEvent } from "../../Timeline";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function processDiplomacy(gameSession) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const countries = Object.values(
    gameSession.world.repositories.countries?.byId ?? {}
  );
  const playerCountryId = gameSession.player?.countryId;
  const relationships = { ...(simulation.relationships ?? {}) };

  for (const country of countries) {
    if (country.id === playerCountryId) continue;
    const current = Number(
      relationships[country.id] ?? country.relations ?? 0
    );
    relationships[country.id] = clamp(current, -100, 100);
  }

  let nextSession = updateRuntime(gameSession, {
    ...runtime,
    simulation: {
      ...simulation,
      relationships,
    },
  });

  if (countries.length > 1 && runtime.time.turn % 4 === 0) {
    nextSession = addTimelineEvent(nextSession, {
      category: "diplomacy",
      source: "diplomacy-engine",
      key: "diplomatic_pulse",
      data: { countries: countries.length },
      editable: false,
    });
  }

  return nextSession;
}
