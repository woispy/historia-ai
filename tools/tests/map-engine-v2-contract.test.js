import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const renderer = read("src/map/rendering/gpu/GpuMapRenderer.js");
const host = read("src/map/rendering/MapEngineV2.jsx");
const soa = read("src/map/runtime/ProvinceSoA.js");
const spatial = read("src/map/runtime/SpatialIndex.js");
const camera = read("src/map/runtime/MapCameraRig.js");
const factory = read("src/map/rendering/RenderingFactory.js");

assert.match(renderer, /getContext\("webgl2"/);
assert.match(renderer, /createPickFramebuffer/);
assert.match(renderer, /readPixels\(x, y, 1, 1/);
assert.match(renderer, /deleteTexture\(state\.provinceTexture\)/);
assert.match(renderer, /deleteProgram\(state\.program\)/);
assert.match(renderer, /preserveDrawingBuffer: false/);
assert.match(host, /<canvas/);
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

console.log("Map Engine v2 contract passed: GPU-first renderer boundary, FBO picking, typed province state, quadtree index and clamped 2.5D camera.");
