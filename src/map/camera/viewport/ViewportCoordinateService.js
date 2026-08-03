/**
 * ============================================================================
 * Historia AI
 * Viewport Coordinate Service
 * ============================================================================
 *
 * Converts coordinates between world space and screen space.
 *
 * Camera
 * ------
 * Camera stores the world position currently viewed.
 *
 * Viewport
 * --------
 * Stores screen dimensions.
 *
 * This service performs no rendering.
 * It only converts coordinates.
 */

/**
 * Returns the viewport center.
 */
export function getViewportCenter(
  viewport
) {
  return {
    x:
      viewport.width / 2,

    y:
      viewport.height / 2,
  };
}

/**
 * Converts world coordinates into screen coordinates.
 */
export function worldToScreen(
  worldX,
  worldY,
  camera,
  viewport
) {
  const center =
    getViewportCenter(
      viewport
    );

  return {
    x:
      (worldX - camera.x) *
        camera.zoom +
      center.x,

    y:
      (worldY - camera.y) *
        camera.zoom +
      center.y,
  };
}

/**
 * Converts screen coordinates into world coordinates.
 */
export function screenToWorld(
  screenX,
  screenY,
  camera,
  viewport
) {
  const center =
    getViewportCenter(
      viewport
    );

  return {
    x:
      camera.x +
      (screenX - center.x) /
        camera.zoom,

    y:
      camera.y +
      (screenY - center.y) /
        camera.zoom,
  };
}