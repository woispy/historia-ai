import { getState, updateState } from "../../../state/index.js";
import { addTimelineEvent } from "../../Timeline/index.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMonths(unit, amount) {
  switch (unit) {
    case "day":
      return amount / 30;
    case "week":
      return amount / 4;
    case "month":
      return amount;
    case "year":
      return amount * 12;
    default:
      return 1;
  }
}

export function processEconomy(gameSession) {
  const state = getState(gameSession);
  const simulation = state.simulation ?? {};
  const playerCountryId = gameSession.player?.countryId;
  const cities = Object.values(
    gameSession.world.repositories.cities?.byId ?? {}
  ).filter((city) => city.owner === playerCountryId);
  const unit = state.time.lastUnit ?? "week";
  const amount = Number(state.time.lastAmount ?? 1);
  const elapsedMonths = Math.max(0, normalizeMonths(unit, amount));

  const cityCount = Math.max(cities.length, 1);
  const prosperity = cities.reduce(
    (sum, city) => sum + (Number(city.prosperity) || 0),
    0
  ) / cityCount;
  const food = cities.reduce(
    (sum, city) => sum + (Number(city.food) || 0),
    0
  ) / cityCount;

  const baseMonthlyIncome = Math.max(5, Math.round(prosperity * cityCount * 0.45));
  const monthlyExpenses = Math.max(2, Math.round((simulation.militaryPower ?? 0) * 0.025));
  const net = Math.round((baseMonthlyIncome - monthlyExpenses) * elapsedMonths);
  const baseIncome = Math.round(baseMonthlyIncome * elapsedMonths);
  const expenses = Math.round(monthlyExpenses * elapsedMonths);

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

  let nextSession = updateState(gameSession, {
    ...state,
    simulation: nextSimulation,
  });

  nextSession = addTimelineEvent(nextSession, {
    category: "economy",
    source: "economy-engine",
    key: net >= 0 ? "treasury_growth" : "treasury_decline",
    data: {
      income: baseIncome,
      expenses,
      net,
      cities: cities.length,
      elapsedMonths,
    },
    editable: false,
  });

  return nextSession;
}
