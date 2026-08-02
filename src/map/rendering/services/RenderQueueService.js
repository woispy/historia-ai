/**
 * ============================================================================
 * Historia AI
 * Render Queue Service
 * ============================================================================
 */

import {
  getVisibleLayers,
} from "./RenderVisibilityService";

import {
  orderRenderLayers,
} from "./RenderOrderingService";

/**
 * Creates render queue.
 */
export function createRenderQueue(
  layers = []
) {
  return orderRenderLayers(
    getVisibleLayers(layers)
  );
}