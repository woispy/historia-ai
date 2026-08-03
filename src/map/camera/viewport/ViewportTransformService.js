/**
 * ============================================================================
 * Historia AI
 * Viewport Transform Service
 * ============================================================================
 *
 * Creates the viewport transform from the current
 * camera state and viewport state.
 *
 * This service is responsible only for producing
 * render transform data.
 */

/**
 * Creates the current view matrix.
 */
export function createViewMatrix(
  camera,
  viewport
) {
  void viewport;

  return {
    x: camera.x,

    y: camera.y,

    zoom: camera.zoom,
  };
}

/**
 * Converts a view matrix into a CSS transform.
 */
export function createViewportTransform(
  camera,
  viewport
) {
  const viewMatrix =
    createViewMatrix(
      camera,
      viewport
    );

  return `
    translate(${viewMatrix.x}px, ${viewMatrix.y}px)
    scale(${viewMatrix.zoom})
  `;
}