import {
  WORLD_MAX_X,
  WORLD_MIN_X,
  WORLD_WIDTH,
  getWorldCopyOffset,
} from "../camera/WorldWrap.js";

/**
 * Return only the periodic world copies that can intersect the horizontal
 * viewport. Canonical geometry stays in one GPU buffer.
 */
export function getVisibleWorldCopyOffsets(cameraX, zoom = 1) {
  const center = Number(cameraX);
  const safeCenter = Number.isFinite(center) ? center : 0;
  const safeZoom = Math.max(0.001, Number(zoom) || 1);
  const halfViewWidth = WORLD_WIDTH / (2 * safeZoom);
  const minVisible = safeCenter - halfViewWidth;
  const maxVisible = safeCenter + halfViewWidth;
  const firstCopy = Math.ceil((minVisible - WORLD_MAX_X) / WORLD_WIDTH);
  const lastCopy = Math.floor((maxVisible - WORLD_MIN_X) / WORLD_WIDTH);
  const offsets = [];

  for (let copyIndex = firstCopy; copyIndex <= lastCopy; copyIndex += 1) {
    offsets.push(getWorldCopyOffset(copyIndex));
  }

  return offsets.length ? offsets : [0];
}

export function worldToCanonicalLongitude(worldX) {
  const numeric = Number(worldX);
  if (!Number.isFinite(numeric)) return WORLD_MIN_X;
  let longitude = (numeric - WORLD_MIN_X) % WORLD_WIDTH;
  if (longitude < 0) longitude += WORLD_WIDTH;
  return longitude + WORLD_MIN_X;
}
