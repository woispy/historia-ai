import {
  hasSave as storageHasSave,
  readSave,
  writeSave,
  deleteSave as storageDeleteSave,
  getSaveInfo,
} from "./SaveStorage.js";
import { serializeGame, deserializeGame } from "./SaveSerializer.js";
import {
  saveGameToSlot,
  loadGameFromSlot,
  deleteGameSlot,
  listSaveSlots,
  hasSaveSlots,
} from "./SaveSlots.js";

/** High-level persistence API used by the game. */
export function saveGame(gameSession) {
  const saveData = serializeGame(gameSession);
  writeSave(saveData);
}

export function autoSave(gameSession) {
  saveGame(gameSession);
  try {
    saveGameToSlot(gameSession, "autosave");
  } catch (error) {
    console.warn("[SaveManager] Autosave slot skipped:", error);
  }
}

export function loadGame() {
  const saveData = readSave();
  if (!saveData) return null;
  return deserializeGame(saveData);
}

export function deleteGame() {
  storageDeleteSave();
}

export function hasGameSave() {
  return storageHasSave() || hasSaveSlots();
}

export function getGameSaveInfo() {
  return getSaveInfo();
}

export {
  saveGameToSlot,
  loadGameFromSlot,
  deleteGameSlot,
  listSaveSlots,
};
