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

export function processTurn(runtime, unit = "week", amount = 1) {
  let nextRuntime = runtime;

  nextRuntime = processTime(nextRuntime, unit, amount);
  nextRuntime = processActions(nextRuntime);
  nextRuntime = processEconomy(nextRuntime);
  nextRuntime = processPopulation(nextRuntime);
  nextRuntime = processDiplomacy(nextRuntime);
  nextRuntime = processMilitary(nextRuntime);
  nextRuntime = processEvents(nextRuntime);
  nextRuntime = processTimeline(nextRuntime);

  return nextRuntime;
}