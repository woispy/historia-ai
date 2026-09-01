/** Renderer state queries. */
export function getRendering(repository) {
  return repository.rendering;
}

export function getRenderer(repository) {
  return repository.rendering?.renderer ?? "webgpu";
}

export function getFallbackRenderer(repository) {
  return repository.rendering?.fallbackRenderer ?? "webgl2";
}

export function getRenderingLayers(repository) {
  return repository.rendering?.layers ?? [];
}

export function isDebugRendering(repository) {
  return repository.rendering?.debug ?? false;
}
