/**
 * ============================================================================
 * Historia AI
 * Rendering Actions
 * ============================================================================
 */

import {
  createRendering,
} from "./RenderingFactory";

import {
  setRendering,
} from "./RenderingRepository";

/**
 * Creates the default rendering model.
 */
export function initializeRendering(
  repository
) {
  return setRendering(
    repository,
    createRendering()
  );
}

/**
 * Replaces current renderer.
 */
export function setRenderer(
  repository,
  renderer
) {
  const current =
    repository.rendering;

  return setRendering(
    repository,
    createRendering({
      ...current,

      renderer,
    })
  );
}

/**
 * Replaces render layers.
 */
export function setRenderingLayers(
  repository,
  layers
) {
  const current =
    repository.rendering;

  return setRendering(
    repository,
    createRendering({
      ...current,

      layers,
    })
  );
}

/**
 * Enables or disables debug rendering.
 */
export function setDebugRendering(
  repository,
  debug
) {
  const current =
    repository.rendering;

  return setRendering(
    repository,
    createRendering({
      ...current,

      debug,
    })
  );
}