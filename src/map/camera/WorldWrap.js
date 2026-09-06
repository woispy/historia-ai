/**
 * Horizontal world wrapping contract.
 *
 * Canonical longitudes are represented in [-180, 180). Renderers may place
 * canonical geometry at integer world-width offsets without duplicating data.
 */

export const WORLD_MIN_X = -180;
export const WORLD_MAX_X = 180;
export const WORLD_WIDTH = WORLD_MAX_X - WORLD_MIN_X;

export function normalizeLongitude(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;

  let longitude = (numeric - WORLD_MIN_X) % WORLD_WIDTH;
  if (longitude < 0) longitude += WORLD_WIDTH;
  return longitude + WORLD_MIN_X;
}

export function getWorldCopyIndex(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.floor((numeric - WORLD_MIN_X) / WORLD_WIDTH);
}

export function getWorldCopyOffset(copyIndex) {
  const index = Number(copyIndex);
  return Number.isFinite(index) ? Math.trunc(index) * WORLD_WIDTH : 0;
}

export function getNearestWorldCopyOffset(worldX, referenceX) {
  const canonicalX = normalizeLongitude(worldX);
  const reference = Number(referenceX);
  if (!Number.isFinite(reference)) return 0;
  return Math.round((reference - canonicalX) / WORLD_WIDTH) * WORLD_WIDTH;
}
