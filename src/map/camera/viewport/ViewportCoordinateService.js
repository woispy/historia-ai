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
 * Calculates the translation required to place
 * the current camera position at the viewport center.
 *
 * This translation is shared by the rendering pipeline
 * and future camera systems.
 */
export function getViewportTranslation(
  camera,
  viewport
) {
  const center =
    getViewportCenter(
      viewport
    );

  return {
    x:
      center.x -
      camera.x *
        camera.zoom,

    y:
      center.y -
      camera.y *
        camera.zoom,
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
  const translation =
    getViewportTranslation(
      camera,
      viewport
    );

  return {
    x:
      worldX *
        camera.zoom +
      translation.x,

    y:
      worldY *
        camera.zoom +
      translation.y,
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
  const translation =
    getViewportTranslation(
      camera,
      viewport
    );

  return {
    x:
      (screenX -
        translation.x) /
      camera.zoom,

    y:
      (screenY -
        translation.y) /
      camera.zoom,
  };
}