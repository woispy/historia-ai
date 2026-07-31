/**
 * ============================================================================
 * Historia AI
 * Save Storage
 * ============================================================================
 *
 * Responsible only for reading and writing save data.
 *
 * Current backend:
 * - localStorage
 *
 * Future backends:
 * - IndexedDB
 * - Steam Cloud
 * - Remote API
 *
 * This module does NOT know anything about GameSession.
 */

const SAVE_KEY = "historia-ai-save";

/**
 * Returns whether a save exists.
 */
export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * Saves raw data.
 *
 * @param {object} data
 */
export function writeSave(data) {
  if (!data) {
    throw new Error("Save data is required.");
  }

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(data)
  );
}

/**
 * Reads raw save data.
 *
 * @returns {object|null}
 */
export function readSave() {
  const json = localStorage.getItem(SAVE_KEY);

  if (!json) {
    return null;
  }

  return JSON.parse(json);
}

/**
 * Deletes the active save.
 */
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * Returns information about the stored save.
 */
export function getSaveInfo() {
  const save = readSave();

  if (!save) {
    return null;
  }

  return {
    version: save.version ?? 1,
    createdAt: save.createdAt ?? null,
    lastPlayed: save.lastPlayed ?? null,
  };
}