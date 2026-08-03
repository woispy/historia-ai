/**
 * ============================================================================
 * Historia AI
 * Viewport Actions
 * ============================================================================
 */

export function resizeViewport(
  viewport,
  width,
  height
) {
  return {
    ...viewport,

    width,

    height,

    centerX: width / 2,

    centerY: height / 2,
  };
}