/**
 * Stable wheel-zoom helpers.
 *
 * Wheel input changes the camera by a percentage of its current zoom level,
 * which keeps the perceived speed consistent at world view and at close range.
 */

const DEFAULT_ZOOM_SENSITIVITY = 0.11;
const MIN_WHEEL_MAGNITUDE = 0.35;
const MAX_WHEEL_MAGNITUDE = 1.5;

function normalizeWheelDelta(event) {
  const raw = Number(event?.deltaY ?? 0);
  if (!Number.isFinite(raw) || raw === 0) return 0;

  // Mouse wheels commonly report line deltas while trackpads report pixels.
  return raw * (event?.deltaMode === 1 ? 16 : 1);
}

export function getWheelZoomDelta(
  event,
  currentZoom,
  sensitivity = DEFAULT_ZOOM_SENSITIVITY,
) {
  const wheelDelta = normalizeWheelDelta(event);
  if (!wheelDelta) return 0;

  const direction = wheelDelta < 0 ? 1 : -1;
  const magnitude = Math.min(
    MAX_WHEEL_MAGNITUDE,
    Math.max(MIN_WHEEL_MAGNITUDE, Math.abs(wheelDelta) / 100),
  );
  const safeZoom = Math.max(1, Number(currentZoom) || 1);
  const safeSensitivity = Math.max(
    0.01,
    Number(sensitivity) || DEFAULT_ZOOM_SENSITIVITY,
  );

  return direction * safeZoom * safeSensitivity * magnitude;
}

export { DEFAULT_ZOOM_SENSITIVITY };
