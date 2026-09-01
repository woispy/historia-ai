import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const renderer = read("src/map/rendering/gpu/GpuMapRenderer.js");
const contract = read("src/map/rendering/MapRendererContract.js");
const controller = read("src/map/runtime/MapRuntimeController.js");
const host = read("src/map/rendering/MapEngineV2.jsx");
const soa = read("src/map/runtime/ProvinceSoA.js");
const spatial = read("src/map/runtime/SpatialIndex.js");
const camera = read("src/map/runtime/MapCameraRig.js");
const factory = read("src/map/rendering/RenderingFactory.js");

assert.match(contract, /class MapRendererContract/);
for (const method of ["initialize", "resize", "setCamera", "pick", "render", "dispose"]) {
  assert.match(contract, new RegExp(`${method}\\(`));
}
assert.match(controller, /requestAnimationFrame/);
assert.match(controller, /queueHover/);
assert.match(controller, /setExternalCamera/);
assert.match(controller, /addEventListener\("pointermove"/);
assert.match(controller, /renderer\.pick/);
assert.match(renderer, /extends MapRendererContract/);
assert.match(renderer, /getContext\("webgl2"/);
assert.match(renderer, /texStorage2D\(gl\.TEXTURE_2D, 1, gl\.RGBA8, 1, 1\)/);
assert.match(renderer, /new Uint8Array\(4\)/);
assert.match(renderer, /readPixels\(0, 0, 1, 1/);
assert.match(renderer, /provinceIdToRasterIndex/);
assert.match(renderer, /deleteTexture\(state\.provinceTexture\)/);
assert.match(renderer, /deleteProgram\(state\.program\)/);
assert.match(renderer, /deleteVertexArray\(state\.quad\.vao\)/);
assert.match(renderer, /preserveDrawingBuffer: false/);
assert.match(host, /<canvas/);
assert.match(host, /MapRuntimeController/);
assert.doesNotMatch(host, /onPointerMove/);
assert.doesNotMatch(host, /rendererRef/);
assert.doesNotMatch(host, /SvgRenderer/);
assert.doesNotMatch(host, /ProvincePolygon/);
assert.match(soa, /Uint32Array/);
assert.match(soa, /Float32Array/);
assert.match(spatial, /class QuadtreeIndex/);
assert.match(camera, /pitchMin/);
assert.match(camera, /yawMax/);
assert.match(camera, /Math\.exp/);
assert.match(factory, /renderer: data\.renderer \?\? "webgpu"/);
assert.match(factory, /fallbackRenderer: data\.fallbackRenderer \?\? "webgl2"/);

console.log("Map Engine v2 contract passed: renderer-neutral lifecycle, imperative interaction ownership, one-pixel picking target, typed province state, quadtree foundation and clamped 2.5D camera.");
