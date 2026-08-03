/**
 * ============================================================================
 * Historia AI
 * Viewport Transform Service
 * ============================================================================
 *
 * Creates the viewport transform from the current
 * camera state and viewport state.
 *
 * This service contains every transformation between
 * world coordinates and screen coordinates.
 *
 * Camera
 * ------
 * Stores only camera state.
 *
 * Viewport
 * --------
 * Stores screen information.
 *
 * Transform
 * ---------
 * Produced here.
 */

export function createViewportTransform(
  camera,
  viewport
) {
  void viewport;

  return `
    translate(${camera.x}px, ${camera.y}px)
    scale(${camera.zoom})
  `;
}