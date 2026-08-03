/**
 * ============================================================================
 * Historia AI
 * Viewport Queries
 * ============================================================================
 */

export function getViewport(
  viewport
) {
  return viewport;
}

export function getViewportSize(
  viewport
) {
  return {
    width: viewport.width,

    height: viewport.height,
  };
}

export function getViewportCenter(
  viewport
) {
  return {
    x: viewport.centerX,

    y: viewport.centerY,
  };
}