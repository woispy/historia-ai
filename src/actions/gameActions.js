import { advanceGameTime } from "../state";

export function advanceWeek(gameState) {
  return advanceGameTime(gameState, "week");
}

export function advanceMonth(gameState) {
  return advanceGameTime(gameState, "month");
}

export function advanceYear(gameState) {
  return advanceGameTime(gameState, "year");
}