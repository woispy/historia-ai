/**
 * ============================================================================
 * Historia AI
 * Render Visibility Service
 * ============================================================================
 *
 * Filters visible render layers.
 */

export function getVisibleLayers(
  layers = []
) {
  return layers.filter(
    (layer) =>
      layer.visible !== false
  );
}