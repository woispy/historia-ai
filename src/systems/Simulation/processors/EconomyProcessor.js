import { getRuntime, updateRuntime } from "../../../state";
import { addTimelineEvent } from "../../Timeline";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function processEconomy(gameSession) {
  const runtime = getRuntime(gameSession);
  const simulation = runtime.simulation ?? {};
  const cities = Object.values(
    gameSession.world.repositories.cities?.byId ?? {}
  );

  const cityProsperity = cities.reduce(
    (sum, city) => sum + (Number(city.prosperity) || 0),
    0
  );
  const cityFood = cities.reduce(
    (sum, city) => sum + (Number(city.food) || 0),
    0
  );
  const cityCount = Math.max(cities.length, 1);

  const prosperity = cityProsperity / cityCount;
  const food = cityFood / cityCount;
  const baseIncome = Math.max(
    5,
    Math.round(prosperity * cityCount * 0.45)
  );
  const expenses = Math.max(
    2,
    Math.round((simulation.militaryPower ?? 0) * 0.025)
  );
  const net = baseIncome - expenses;

  const nextSimulation = {
    ...simulation,
    treasury: Math.max(0, (simulation.treasury ?? 0) + net),
    income: baseIncome,
    expenses,
    food: clamp(food, 0, 100),
    lastTurnSummary:
      net >= 0
        ? `Hazine ${net} altın arttı.`
        : `Hazine ${Math.abs(net)} altın azaldı.`,
  };

  let nextSession = updateRuntime(gameSession, {
    ...runtime,
    simulation: nextSimulation,
  });

  if (net !== 0) {
    nextSession = addTimelineEvent(nextSession, {
      category: "economy",
      source: "economy-engine",
      key: net > 0 ? "treasury_growth" : "treasury_decline",
      data: { income: baseIncome, expenses, net },
      editable: false,
    });
  }

  return nextSession;
}
