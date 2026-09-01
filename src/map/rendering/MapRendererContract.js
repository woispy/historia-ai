/**
 * Renderer-neutral lifecycle contract for WebGPU/WebGL2 map backends.
 * React never owns this lifecycle; the imperative runtime does.
 */
export class MapRendererContract {
  initialize(_assets) { throw new Error("Map renderer must implement initialize(assets)"); }
  resize(_cssWidth, _cssHeight) { throw new Error("Map renderer must implement resize(width, height)"); }
  setCamera(_camera) { throw new Error("Map renderer must implement setCamera(camera)"); }
  setSelectedProvinceId(_provinceId) { throw new Error("Map renderer must implement setSelectedProvinceId(provinceId)"); }
  setHoveredProvinceId(_provinceId) { throw new Error("Map renderer must implement setHoveredProvinceId(provinceId)"); }
  pick(_clientX, _clientY) { throw new Error("Map renderer must implement pick(x, y)"); }
  render() { throw new Error("Map renderer must implement render()"); }
  start() { throw new Error("Map renderer must implement start()"); }
  stop() { throw new Error("Map renderer must implement stop()"); }
  dispose() { throw new Error("Map renderer must implement dispose()"); }
}

export const MAP_RENDERER_BACKENDS = Object.freeze({ WEBGPU: "webgpu", WEBGL2: "webgl2" });

export function assertRendererContract(renderer) {
  const required = [
    "initialize", "resize", "setCamera", "setSelectedProvinceId",
    "setHoveredProvinceId", "pick", "render", "start", "stop", "dispose",
  ];
  for (const method of required) {
    if (!renderer || typeof renderer[method] !== "function") {
      throw new TypeError(`Map renderer contract violation: missing ${method}()`);
    }
  }
  return renderer;
}

export default MapRendererContract;
