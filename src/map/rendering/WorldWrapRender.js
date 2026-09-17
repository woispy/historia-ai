import {
  WORLD_MAX_X,
  WORLD_MIN_X,
  WORLD_WIDTH,
  getWorldCopyOffset,
  normalizeLongitude,
} from "../camera/WorldWrap.js";

/**
 * Return only the periodic world copies that can intersect the horizontal
 * viewport. Canonical geometry stays in one GPU buffer.
 */
export function getVisibleWorldCopyOffsets(cameraX, zoom = 1, options = {}) {
  const center = Number(cameraX);
  const safeCenter = Number.isFinite(center) ? center : 0;
  const safeZoom = Math.max(0.001, Number(zoom) || 1);
  if (options.perspective) {
    const centerCopy = Math.floor((safeCenter - WORLD_MIN_X) / WORLD_WIDTH);
    return [centerCopy - 1, centerCopy, centerCopy + 1].map(getWorldCopyOffset);
  }
  const halfViewWidth = WORLD_WIDTH / (2 * safeZoom) * (options.perspective ? 2 : 1) + (options.perspective ? 1e-6 : 0);
  const minVisible = safeCenter - halfViewWidth;
  const maxVisible = safeCenter + halfViewWidth;
  const firstCopy = Math.floor((minVisible - WORLD_MAX_X) / WORLD_WIDTH) + 1;
  const lastCopy = Math.ceil((maxVisible - WORLD_MIN_X) / WORLD_WIDTH) - 1;
  const offsets = [];

  for (let copyIndex = firstCopy; copyIndex <= lastCopy; copyIndex += 1) {
    offsets.push(getWorldCopyOffset(copyIndex));
  }

  return offsets.length ? offsets : [0];
}

export { normalizeLongitude as worldToCanonicalLongitude };
