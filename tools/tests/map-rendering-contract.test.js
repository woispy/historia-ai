import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const provinceLayer = read("src/map/components/layers/ProvinceLayer.jsx");
const gpuLayer = read("src/map/rendering/gpu/ProvinceTextureLayer.jsx");
const cartographyLayer = read("src/map/components/layers/CartographyLayer.jsx");
const cityLayer = read("src/map/components/layers/CityLayer.jsx");

assert.match(svgRenderer, /id="world-land-mask"/);
assert.match(svgRenderer, /WORLD_LAND_PATH/);
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);

// The GPU layer must be a political-fill compositor only. The physical SVG
// layer owns the ocean/land base, preventing two maps from painting the same
// coastline with slightly different rasters.
assert.ok(gpuLayer.includes("if (texture(uLandMask, vUv).r < 0.5) discard;"));
assert.ok(gpuLayer.includes("if (provinceId < 0.5) discard;"));
assert.ok(!gpuLayer.includes("uWaterColor"));
assert.ok(!gpuLayer.includes("uLandColor"));
assert.ok(gpuLayer.includes("createTexture(gl, raster.landCanvas, false)"));

// Strategic corridors/passes/crossings remain data anchors, not base-map
// decorations. Their old coloured line/dot renderer must stay disabled.
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CORRIDORS"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_PASSES"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CROSSINGS"));

// City presentation is intentionally reduced to clean city/capital markers.
// Port lines and fortress dashed rings belong to a future dedicated symbol
// layer rather than the base cartographic surface.
assert.ok(!cityLayer.includes("strokeDasharray"));
assert.ok(!cityLayer.includes("port &&"));
assert.ok(!cityLayer.includes("fortified &&"));

console.log("Map rendering contract tests passed: physical coastline is authoritative, GPU is transparent outside political land, and decorative artifact layers are disabled.");
