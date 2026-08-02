/**
 * ============================================================================
 * Historia AI
 * Rendering Engine
 * ============================================================================
 */

import {
  bootstrapRendering,
} from "./RenderingBootstrap";

/**
 * Creates the Rendering Engine.
 */
export function createRenderingEngine() {
  return {
    repository:
      bootstrapRendering(),
  };
}