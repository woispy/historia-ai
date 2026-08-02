/**
 * ============================================================================
 * Historia AI
 * Rendering Factory
 * ============================================================================
 *
 * Creates one immutable rendering model.
 */

export function createRendering(data = {}) {
  return Object.freeze({
    id:
      data.id ??
      "rendering",

    layers:
      data.layers ?? [],

    renderer:
      data.renderer ??
      "svg",

    debug:
      data.debug ??
      false,
  });
}