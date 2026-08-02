/**
 * ============================================================================
 * Historia AI
 * Rendering Repository
 * ============================================================================
 */

export function createRenderingRepository() {
  return {
    rendering: null,
  };
}

export function setRendering(
  repository,
  rendering
) {
  return {
    ...repository,

    rendering,
  };
}

export function resetRendering() {
  return createRenderingRepository();
}