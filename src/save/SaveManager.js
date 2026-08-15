import {
  hasSave as storageHasSave,
  readSave,
  writeSave,
  deleteSave as storageDeleteSave,
  getSaveInfo,
} from "./SaveStorage.js";

import {
  serializeGame,
  deserializeGame,
} from "./SaveSerializer.js";

/**
 * ============================================================================
 * Historia AI
 * Save Manager
 * ============================================================================
 *
 * High-level API used by the game.
 *
 * Responsibilities
 * ----------------
 * - Save game
 * - Load game
 * - Auto save
 * - Delete save
 * - Query save information
 *
 * This is the ONLY module the rest of the game should use.
 */

/**
 * Saves the current game session.
 *
 * @param {object} gameSession
 */
export function saveGame(gameSession) {
  const saveData = serializeGame(gameSession);

  writeSave(saveData);
}

/**
 * Performs an automatic save.
 *
 * Currently identical to saveGame().
 * Future versions may throttle or delay writes.
 *
 * @param {object} gameSession
 */
export function autoSave(gameSession) {
  saveGame(gameSession);
}

/**
 * Loads the saved game session.
 *
 * @returns {object|null}
 */
export function loadGame() {
  const saveData = readSave();

  if (!saveData) {
    return null;
  }

  return deserializeGame(saveData);
}

/**
 * Deletes the active save.
 */
export function deleteGame() {
  storageDeleteSave();
}

/**
 * Returns whether a save exists.
 *
 * @returns {boolean}
 */
export function hasGameSave() {
  return storageHasSave();
}

/**
 * Returns metadata about the current save.
 *
 * @returns {object|null}
 */
export function getGameSaveInfo() {
  return getSaveInfo();
}
