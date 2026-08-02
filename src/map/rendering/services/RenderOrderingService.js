/**
 * ============================================================================
 * Historia AI
 * Render Ordering Service
 * ============================================================================
 *
 * Returns render layers sorted by priority.
 */

export function orderRenderLayers(
  layers = []
) {
  return [...layers].sort(
    (left, right) =>
      left.priority -
      right.priority
  );
}