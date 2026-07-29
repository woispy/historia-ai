import {
  processTime,
  processEconomy,
  processPopulation,
  processDiplomacy,
  processMilitary,
  processEvents,
  processNotifications,
} from "./processors";

export function processTurn(gameState, unit = "week", amount = 1) {
  let nextState = gameState;

  nextState = processTime(nextState, unit, amount);
  nextState = processEconomy(nextState);
  nextState = processPopulation(nextState);
  nextState = processDiplomacy(nextState);
  nextState = processMilitary(nextState);
  nextState = processEvents(nextState);
  nextState = processNotifications(nextState);

  return nextState;
}