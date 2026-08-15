import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const mapView = read("src/components/GameShell/MapView/MapView.jsx");
const mapViewCss = read("src/components/GameShell/MapView/MapView.css");
const provinceLayer = read("src/map/components/layers/ProvinceLayer.jsx");
const gpuLayer = read("src/map/rendering/gpu/ProvinceTextureLayer.jsx");
const cartographyLayer = read("src/map/components/layers/CartographyLayer.jsx");
const cityLayer = read("src/map/components/layers/CityLayer.jsx");
const physicalLayer = read("src/map/components/layers/WorldPhysicalLayer.jsx");

// One physical coastline authority and one map viewport. The game viewport
// must not mount a second legacy/far-zoom map or empty overlay map layers.
assert.equal((worldMap.match(/<SvgRenderer\b/g) ?? []).length, 1);
assert.equal((worldMap.match(/<WorldPhysicalLayer\s*\/>/g) ?? []).length, 1);
assert.equal((worldMap.match(/<ProvinceTextureLayer\b/g) ?? []).length, 1);
assert.equal((mapView.match(/<WorldMap\b/g) ?? []).length, 1);
assert.ok(!mapView.includes("country-layer"));
assert.ok(!mapView.includes("city-layer"));
assert.ok(!mapView.includes("army-layer"));
assert.ok(!mapView.includes("effect-layer"));
assert.ok(!mapViewCss.includes(".country-layer"));
assert.ok(!mapViewCss.includes(".city-layer"));
assert.ok(!mapViewCss.includes(".army-layer"));
assert.ok(!mapViewCss.includes(".effect-layer"));

// The physical world owns the complete water/land base. Political geometry
// may only appear inside its land silhouette.
assert.match(svgRenderer, /id="world-land-mask"/);
assert.match(svgRenderer, /WORLD_LAND_PATH/);
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);
assert.match(physicalLayer, /WORLD_LAND_PATH/);
assert.match(physicalLayer, /WORLD_PHYSICAL_ATLAS\.water\.fill/);

// The GPU layer is a political-fill compositor only. Its political raster is
// hard-masked to physical land before upload, and the shader repeats the mask
// check as defence in depth. It never supplies its own water or land base.
assert.ok(gpuLayer.includes("globalCompositeOperation = \"destination-in\""));
assert.ok(gpuLayer.includes("applyLandMask(provinceContext, landCanvas)"));
assert.ok(gpuLayer.includes("if (texture(uLandMask, vUv).r < 0.5) discard;"));
assert.ok(gpuLayer.includes("if (encodedProvince.a < 0.5) discard;"));
assert.ok(gpuLayer.includes("if (provinceId < 0.5) discard;"));
assert.ok(!gpuLayer.includes("uWaterColor"));
assert.ok(!gpuLayer.includes("uLandColor"));
assert.ok(gpuLayer.includes("createTexture(gl, raster.landCanvas, false)"));

// Camera movement must redraw the existing GPU state, not rebuild the 4096x2048
// political texture on every mouse-wheel/pan update.
assert.match(gpuLayer, /useEffect\(\(\) => \{\n\s{4}cameraRef\.current = camera/);
assert.match(gpuLayer, /\}, \[gpuEnabled, onReady, raster\]\);/);
assert.ok(gpuLayer.includes("renderFrame(state, camera, rect.width, rect.height)"));

// CPU and GPU political fills have an explicit handoff: only one visible
// compositor is active after the first GPU frame has rendered.
assert.ok(worldMap.includes("const gpuProvinceActive = useGpuProvinceFill && textureReady;"));
assert.ok(worldMap.includes("renderFill={!gpuProvinceActive}"));
assert.ok(gpuLayer.includes("Handoff happens only after the first GPU frame has been rendered"));

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

// The old no-op physical phases must not be mounted as extra map layers.
assert.ok(!worldMap.includes('phase="base"'));
assert.ok(!worldMap.includes('phase="water"'));

console.log("Map rendering contract tests passed: one synchronized map, one physical coastline authority, no political pixels over sea, and no legacy overlay layers.");
