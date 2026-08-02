/**
 * ============================================================================
 * Historia AI
 * Rendering Bootstrap
 * ============================================================================
 */

import {
  createRenderingRepository,
} from "./RenderingRepository";

import {
  initializeRendering,
} from "./RenderingActions";

/**
 * Creates the initial Rendering Engine state.
 */
export function bootstrapRendering() {
  let repository =
    createRenderingRepository();

  repository =
    initializeRendering(
      repository
    );

  return repository;
}