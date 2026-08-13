/**
 * Stable wheel-zoom helpers.
 *
 * Wheel input is converted into a multiplicative zoom step. The same wheel
 * gesture therefore feels equally strong at world view and at deep regional
 * zoom instead of becoming perceptually sluggish or explosive near the zoom
 * limits.
 */

const DEFAULT_ZOOM_SENSITIVITY = 0.11;
const MIN_WHEEL_MAGNITUDE = 0.35;
const MAX_WHEEL_MAGNITUDE = 1.5;
const MAX_ZOOM_FACTOR = 1.28;
const MIN_ZOOM_FACTOR = 1 / MAX_ZOOM_FACTOR;

function normalizeWheelDelta(event) {
  const raw = Number(event?.deltaY ?? 0);
  if (!Number.isFinite(raw) || raw === 0) return 0;

  // Mouse wheels commonly report line deltas while trackpads report pixels.
  return raw * (event?.deltaMode === 1 ? 16 : 1);
}

export function getWheelZoomFactor(
  event,
  sensitivity = DEFAULT_ZOOM_SENSITIVITY,
) {
  const wheelDelta = normalizeWheelDelta(event);
  if (!wheelDelta) return 1;

  const direction = wheelDelta < 0 ? 1 : -1;
  const magnitude = Math.min(
    MAX_WHEEL_MAGNITUDE,
    Math.max(MIN_WHEEL_MAGNITUDE, Math.abs(wheelDelta) / 100),
  );
  const safeSensitivity = Math.max(
    0.01,
    Number(sensitivity) || DEFAULT_ZOOM_SENSITIVITY,
  );

  const rawFactor = Math.exp(direction * safeSensitivity * magnitude);
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, rawFactor));
}

/**
 * Backwards-compatible additive delta for callers that still use zoomCamera.
 * The delta is derived from a multiplicative factor, so it remains proportional
 * to the current zoom at every scale.
 */
export function getWheelZoomDelta(
  event,
  currentZoom,
  sensitivity = DEFAULT_ZOOM_SENSITIVITY,
) {
  const safeZoom = Math.max(0.001, Number(currentZoom) || 1);
  return safeZoom * (getWheelZoomFactor(event, sensitivity) - 1);
}

export { DEFAULT_ZOOM_SENSITIVITY, MAX_ZOOM_FACTOR, MIN_ZOOM_FACTOR };
