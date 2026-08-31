import assert from "node:assert/strict";
import { backendCapabilities } from "../../src/map/runtime/GpuBackendRouter.js";

const webgpu = backendCapabilities("webgpu");
assert.equal(webgpu.webgpu, true);
assert.equal(webgpu.indexedGeometry, true);
assert.equal(webgpu.gpuPicking, true);
assert.equal(webgpu.svgInteraction, false);
assert.equal(webgpu.rasterProvinceBridge, false);

const webgl2 = backendCapabilities("webgl2");
assert.equal(webgl2.webgpu, false);
assert.equal(webgl2.webgl2, true);
assert.equal(webgl2.indexedGeometry, true);
assert.equal(webgl2.gpuPicking, true);
assert.equal(webgl2.svgInteraction, false);
assert.equal(webgl2.rasterProvinceBridge, false);

console.log("GPU backend router contract passed: WebGPU-first, WebGL2 fallback, SVG/raster province interaction disabled.");
