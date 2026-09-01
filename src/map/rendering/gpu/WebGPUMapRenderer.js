/**
 * WebGPU backend skeleton sharing the renderer-neutral map contract.
 *
 * The current production default remains WebGL2 until the browser/device has
 * proven WebGPU availability. Keeping this backend separate prevents a second
 * rendering architecture from leaking into React or gameplay code.
 */
export class WebGPUMapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.destroyed = false;
  }

  static isSupported() {
    return typeof navigator !== "undefined" && Boolean(navigator.gpu);
  }

  async initialize() {
    if (!WebGPUMapRenderer.isSupported()) return false;
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return false;
    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu");
    if (!this.context) return false;
    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device: this.device, format, alphaMode: "opaque" });
    return true;
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pipeline = null;
    this.context = null;
    this.device?.destroy?.();
    this.device = null;
  }
}

export default WebGPUMapRenderer;
