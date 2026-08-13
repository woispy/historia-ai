/**
 * Stable wheel-zoom helpers.
 *
 * Zoom is multiplicative rather than additive. That preserves the same
 * perceived zoom speed at world scale and at close range, while the camera
 * controller coalesces high-frequency wheel events into animation frames.
 */

const DEFAULT_ZOOM_SENSITIVITY = 0.08;
const MIN_WHEEL_MAGNITUDE = 0.35;
const MAX_WHEEL_MAGNITUDE = 1.5;

function normalizeWheelDelta(event) {
  const raw = Number(event?.deltaY ?? 0);
  if (!Number.isFinite(raw) || raw === 0) return 0;

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
  const safeZoom = Math.max(0.75, Number(currentZoom) || 1);
  const safeSensitivity = Math.max(
    0.01,
    Number(sensitivity) || DEFAULT_ZOOM_SENSITIVITY,
  );

  const scale = Math.exp(direction * safeSensitivity * magnitude);
  return safeZoom * (scale - 1);
}

export { DEFAULT_ZOOM_SENSITIVITY };
