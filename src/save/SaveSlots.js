/**
 * Multi-slot browser save storage.
 *
 * SaveStorage remains the raw storage layer; this module owns slot semantics.
 */

import { deserializeGame, serializeGame } from "./SaveSerializer.js";

const SAVE_SLOTS_KEY = "historia-ai-save-slots";
const MAX_MANUAL_SLOTS = 8;
const AUTOSAVE_SLOT = "autosave";

function readSlots() {
  const json = localStorage.getItem(SAVE_SLOTS_KEY);
  if (!json) return {};

  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeSlots(slots) {
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
}

function slotLabel(slotId) {
  return slotId === AUTOSAVE_SLOT ? "Otomatik Kayıt" : `Kayıt ${slotId}`;
}

function buildRecord(slotId, saveData) {
  const session = saveData.session;
  const date = session?.state?.time?.currentDate ?? session?.state?.time?.date ?? null;
  const simulation = session?.state?.simulation ?? {};

  return {
    slotId,
    label: slotLabel(slotId),
    version: saveData.version,
    createdAt: saveData.createdAt ?? null,
    lastPlayed: saveData.lastPlayed ?? null,
    scenarioId: session?.scenario?.id ?? null,
    countryId: session?.player?.countryId ?? null,
    characterName: session?.player?.character?.name ?? "Adsız Karakter",
    gameDate: date,
    treasury: Number(simulation.treasury ?? 0),
  };
}

export function listSaveSlots() {
  const slots = readSlots();
  return Object.values(slots)
    .filter((entry) => entry?.save)
    .map((entry) => entry.info)
    .sort((a, b) => {
      if (a.slotId === AUTOSAVE_SLOT) return -1;
      if (b.slotId === AUTOSAVE_SLOT) return 1;
      return String(b.lastPlayed ?? "").localeCompare(String(a.lastPlayed ?? ""));
    });
}

export function saveGameToSlot(gameSession, slotId) {
  const normalizedSlot = String(slotId ?? "").trim();
  if (!normalizedSlot) throw new Error("Save slot is required.");

  const saveData = serializeGame(gameSession);
  const slots = readSlots();
  const info = buildRecord(normalizedSlot, saveData);
  slots[normalizedSlot] = { info, save: saveData };
  writeSlots(slots);
  return info;
}

export function loadGameFromSlot(slotId) {
  const entry = readSlots()[String(slotId)];
  if (!entry?.save) return null;
  return deserializeGame(entry.save);
}

export function deleteGameSlot(slotId) {
  const normalizedSlot = String(slotId ?? "").trim();
  if (!normalizedSlot) return;

  const slots = readSlots();
  delete slots[normalizedSlot];
  writeSlots(slots);
}

export function hasSaveSlots() {
  return listSaveSlots().length > 0;
}

export function getSaveSlotInfo(slotId) {
  return listSaveSlots().find((entry) => entry.slotId === String(slotId)) ?? null;
}

export function getManualSaveSlots() {
  return Array.from({ length: MAX_MANUAL_SLOTS }, (_, index) => String(index + 1));
}

export { AUTOSAVE_SLOT, MAX_MANUAL_SLOTS };
