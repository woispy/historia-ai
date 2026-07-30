import {
  processTime,
  processActions,
  processEconomy,
  processPopulation,
  processDiplomacy,
  processMilitary,
  processEvents,
  processTimeline,
} from "./processors";

export function processTurn(gameState, unit = "week", amount = 1) {
  let nextState = gameState;

  nextState = processTime(nextState, unit, amount);
  nextState = processActions(nextState);
  nextState = processEconomy(nextState);
  nextState = processPopulation(nextState);
  nextState = processDiplomacy(nextState);
  nextState = processMilitary(nextState);
  nextState = processEvents(nextState);
  nextState = processTimeline(nextState);

  return nextState;
}