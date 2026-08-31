import { createWebGPUProvinceRenderer } from "../rendering/gpu/WebGPUProvinceRenderer.js";
import { createIndexedProvinceRenderer } from "../rendering/gpu/ProvinceGpuRendererV2.js";

/** Select exactly one GPU province backend. WebGPU is preferred; WebGL2 is deterministic fallback. */
export async function createGpuBackend(canvas, pack) {
  if (!canvas) throw new Error("GPU backend requires a canvas");
  const webgpu = await createWebGPUProvinceRenderer(canvas, pack);
  if (webgpu) return { kind: "webgpu", renderer: webgpu };
  return { kind: "webgl2", renderer: createIndexedProvinceRenderer(canvas) };
}

export function backendCapabilities(kind) {
  return Object.freeze({ webgpu: kind === "webgpu", webgl2: kind === "webgl2", indexedGeometry: true, gpuPicking: true, svgInteraction: false, rasterProvinceBridge: false });
}
