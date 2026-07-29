import { processTurn } from "../systems/Turn";

export function advanceWeek(gameState) {
  return processTurn(gameState, "week");
}

export function advanceMonth(gameState) {
  return processTurn(gameState, "month");
}

export function advanceYear(gameState) {
  return processTurn(gameState, "year");
}