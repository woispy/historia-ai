/**
 * ============================================================================
 * Historia AI
 * Viewport Transform Service
 * ============================================================================
 *
 * Produces render transform data from the current
 * camera and viewport state.
 *
 * This service does not perform coordinate conversion.
 * Coordinate conversion belongs to
 * ViewportCoordinateService.
 */

/**
 * Creates the current View Matrix.
 */
export function createViewMatrix(
  camera,
  viewport
) {
  void viewport;

  return {
    translation: {
      x: camera.x,

      y: camera.y,
    },

    scale: camera.zoom,
  };
}

/**
 * Converts the current View Matrix
 * into a CSS transform.
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
    translate(
      ${viewMatrix.translation.x}px,
      ${viewMatrix.translation.y}px
    )
    scale(${viewMatrix.scale})
  `;
}