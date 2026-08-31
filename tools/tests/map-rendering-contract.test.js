import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const worldMap = read("src/map/components/WorldMap.jsx");
const mapView = read("src/components/GameShell/MapView/MapView.jsx");
const mapViewCss = read("src/components/GameShell/MapView/MapView.css");
const gpuRenderer = read("src/map/rendering/gpu/GpuMapRenderer.js");
const engineHost = read("src/map/rendering/MapEngineV2.jsx");
const rendererFactory = read("src/map/rendering/RenderingFactory.js");
const rendererQueries = read("src/map/rendering/RenderingQueries.js");

// The runtime map surface is now one Canvas/WebGL host. React does not mount
// SVG province/path trees or duplicate political compositors.
assert.equal((worldMap.match(/<MapEngineV2\b/g) ?? []).length, 1);
assert.ok(!worldMap.includes("SvgRenderer"));
assert.ok(!worldMap.includes("ProvinceTextureLayer"));
assert.ok(!worldMap.includes("ProvinceLayer"));
assert.ok(!worldMap.includes("CityLayer"));
assert.ok(!mapView.includes("country-layer"));
assert.ok(!mapView.includes("city-layer"));
assert.ok(!mapView.includes("army-layer"));
assert.ok(!mapView.includes("effect-layer"));
assert.ok(!mapViewCss.includes(".country-layer"));
assert.ok(!mapViewCss.includes(".city-layer"));
assert.ok(!mapViewCss.includes(".army-layer"));
assert.ok(!mapViewCss.includes(".effect-layer"));

// GPU backend owns interaction and selection via an offscreen ID target.
assert.match(gpuRenderer, /getContext\("webgl2"/);
assert.match(gpuRenderer, /createPickFramebuffer/);
assert.match(gpuRenderer, /readPixels\(x, y, 1, 1/);
assert.match(engineHost, /onClick=\{handleClick\}/);
assert.match(engineHost, /rendererRef\.current\?\.pick/);

// GPU resource ownership has an explicit destroy path to prevent context
// resource leaks during scenario/map swaps.
assert.match(gpuRenderer, /deleteTexture\(state\.paletteTexture\)/);
assert.match(gpuRenderer, /deleteTexture\(state\.provinceTexture\)/);
assert.match(gpuRenderer, /deleteTexture\(state\.landTexture\)/);
assert.match(gpuRenderer, /deleteFramebuffer\(state\.fbo\.framebuffer\)/);
assert.match(gpuRenderer, /deleteBuffer\(state\.quad\.buffer\)/);
assert.match(gpuRenderer, /deleteProgram\(state\.program\)/);
assert.match(gpuRenderer, /deleteProgram\(state\.pickProgram\)/);
assert.match(gpuRenderer, /preserveDrawingBuffer: false/);

// Backend contract is GPU-first and leaves WebGL2 as the compatibility floor.
assert.match(rendererFactory, /renderer: data\.renderer \?\? "webgpu"/);
assert.match(rendererFactory, /fallbackRenderer: data\.fallbackRenderer \?\? "webgl2"/);
assert.match(rendererQueries, /getFallbackRenderer/);

console.log("Map rendering contract passed: one Canvas/GPU surface, GPU picking, explicit GPU cleanup and GPU-first backend policy.");
