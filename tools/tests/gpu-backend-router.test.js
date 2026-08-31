import assert from "node:assert/strict";
import { backendCapabilities } from "../../src/map/runtime/GpuBackendRouter.js";

for (const kind of ["webgpu", "webgl2"]) {
  const capabilities = backendCapabilities(kind);
  assert.equal(capabilities.indexedGeometry, true);
  assert.equal(capabilities.gpuPicking, true);
  assert.equal(capabilities.svgInteraction, false);
  assert.equal(capabilities.rasterProvinceBridge, false);
}
assert.equal(backendCapabilities("webgpu").webgpu, true);
assert.equal(backendCapabilities("webgl2").webgl2, true);
console.log("GPU backend router contract passed.");
