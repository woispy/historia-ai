/**
 * ============================================================================
 * Historia AI
 * Rendering Queries
 * ============================================================================
 */

export function getRendering(
  repository
) {
  return repository.rendering;
}

export function getRenderer(
  repository
) {
  return (
    repository.rendering
      ?.renderer ?? "svg"
  );
}

export function getRenderingLayers(
  repository
) {
  return (
    repository.rendering
      ?.layers ?? []
  );
}

export function isDebugRendering(
  repository
) {
  return (
    repository.rendering
      ?.debug ?? false
  );
}