/**
 * Renderer-neutral model. Runtime backend selection is GPU-first.
 */
export function createRendering(data = {}) {
  return Object.freeze({
    id: data.id ?? "rendering",
    layers: data.layers ?? [],
    renderer: data.renderer ?? "webgpu",
    fallbackRenderer: data.fallbackRenderer ?? "webgl2",
    debug: data.debug ?? false,
  });
}
