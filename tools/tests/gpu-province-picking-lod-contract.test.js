import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const host = read("src/map/rendering/MapEngineV2.jsx");
const renderer = read("src/map/rendering/gpu/GpuMapRenderer.js");
const visibility = read("src/map/runtime/GpuProvinceVisibility.js");
const pipeline = read("src/map/rendering/gpu/GpuProvincePipeline.js");

assert.match(host, /<canvas/);
assert.doesNotMatch(host, /SvgRenderer|ProvincePolygon|onMouse/);
assert.match(host, /\.pick\(event\.clientX, event\.clientY\)/);
assert.match(renderer, /createPickFramebuffer/);
assert.match(renderer, /gl\.readPixels\(x, y, 1, 1/);
assert.match(renderer, /gl\.bindFramebuffer\(gl\.FRAMEBUFFER, fbo\.framebuffer\)/);
assert.match(visibility, /selectProvinceLod/);
assert.match(visibility, /queryVisibleProvinceIndices/);
assert.match(visibility, /index\.query\(/);
assert.match(pipeline, /new ProvinceSoA/);
assert.match(pipeline, /new QuadtreeIndex/);
assert.match(pipeline, /buildVisibilityPlan/);
assert.match(pipeline, /provinceIdAtIndex/);

console.log("GPU picking + LOD contract passed: single canvas, FBO readback, quadtree visibility and unified province pipeline.");
