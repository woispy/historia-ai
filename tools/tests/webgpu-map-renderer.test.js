import assert from "node:assert/strict";
import { WebGPUMapRenderer, CULL_WGSL } from "../../src/map/rendering/gpu/WebGPUMapRenderer.js";
import { MapRendererContract, assertRendererContract } from "../../src/map/rendering/MapRendererContract.js";

const renderer = new WebGPUMapRenderer({});
assertRendererContract(renderer);
assert(renderer instanceof MapRendererContract);
assert.match(CULL_WGSL, /@compute @workgroup_size\(64\)/);
assert.match(CULL_WGSL, /var<storage, read> tiles/);
assert.match(CULL_WGSL, /var<storage, read> lods/);
assert.match(CULL_WGSL, /var<storage, read> bounds/);
assert.match(CULL_WGSL, /var<storage, read_write> indirect/);
assert.match(CULL_WGSL, /camera/);
assert.equal(WebGPUMapRenderer.isSupported(), false);
const initialized = await renderer.initialize({ assetSource: {} });
assert.equal(initialized, false);
renderer.dispose();
console.log("WebGPU renderer contract passed: MapRendererContract compatibility, safe unsupported-device fallback and storage/culling skeleton are present.");
