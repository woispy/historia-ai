import {
  createGameTime,
  advanceWeeks,
  advanceMonths,
  advanceYears,
} from "../systems/Time";

import { createWorld } from "../world";

export function createInitialGameState() {
  return {
    // Zaman sistemi
    time: createGameTime(),

    // Oyuncu bilgileri
    player: {},

    // Dünya durumu
    world: createWorld(),

    // Oyun zaman akışı
    timeline: [],

    // Bu tur içerisinde oyuncunun verdiği,
    // henüz işlenmemiş emirler
    pendingActions: [],

    // Oyun ayarları
    settings: {},
  };
}

export function advanceGameTime(gameState, unit = "week", amount = 1) {
  let nextDate = gameState.time.currentDate;

  switch (unit) {
    case "week":
      nextDate = advanceWeeks(nextDate, amount);
      break;

    case "month":
      nextDate = advanceMonths(nextDate, amount);
      break;

    case "year":
      nextDate = advanceYears(nextDate, amount);
      break;

    default:
      return gameState;
  }

  return {
    ...gameState,

    time: {
      ...gameState.time,
      currentDate: nextDate,
      turn: gameState.time.turn + 1,
    },
  };
}