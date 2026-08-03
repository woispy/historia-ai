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
    x: viewport.width / 2,
    y: viewport.height / 2,
  };
}