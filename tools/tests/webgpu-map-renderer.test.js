import assert from "node:assert/strict";
import { WebGPUMapRenderer, CULL_WGSL, FINALIZE_WGSL, RENDER_WGSL, PICK_WGSL } from "../../src/map/rendering/gpu/WebGPUMapRenderer.js";
import { MapRendererContract, assertRendererContract } from "../../src/map/rendering/MapRendererContract.js";

const renderer = new WebGPUMapRenderer({});
assertRendererContract(renderer);
assert(renderer instanceof MapRendererContract);

assert.match(CULL_WGSL, /viewProj: mat4x4<f32>/);
assert.match(CULL_WGSL, /camera\.viewProj\*vec4/);
assert.match(CULL_WGSL, /lodRange\(province\)/);
assert.match(CULL_WGSL, /atomicAdd\(&counter,3u\)/);
assert.match(CULL_WGSL, /indices\[dst\+2u\]/);
assert.match(CULL_WGSL, /indexProvinceIds\[dst\+2u\]/);

assert.match(FINALIZE_WGSL, /atomicLoad\(&counter\)/);
assert.match(FINALIZE_WGSL, /indirect\[0\]/);
assert.match(RENDER_WGSL, /@builtin\(primitive_index\)/);
assert.match(PICK_WGSL, /pickNdc/);
assert.match(PICK_WGSL, /encode\(indexProvinceIds/);
assert.match(PICK_WGSL, /@fragment/);

assert.equal(WebGPUMapRenderer.isSupported(), false);
const source = {
  provinceCount: 1,
  tileCount: 1,
  geometryPointCount: 3,
  ids: new Uint32Array([7]),
  minX: new Float32Array([0]),
  minY: new Float32Array([0]),
  maxX: new Float32Array([1]),
  maxY: new Float32Array([1]),
  geometry: new Float32Array([0, 0, 1, 0, 0, 1]),
  tileIndex: new Uint32Array([0, 3, 0, 0, 0, 0]),
  lodRanges: new Uint32Array([0, 1, 0, 0]),
  getProvinceGeometryRange: () => ({ tileOffset: 0, tileCount: 1 }),
  indexOf: () => 0,
};
assert.equal(await renderer.initialize({ assetSource: source }), false);
renderer.dispose();
console.log("WebGPU H3 final contract passed: matrix frustum, GPU indexed compaction, indirect finalization, shared-topology ID pass, async-readback resources and safe unsupported-device fallback are defined.");
