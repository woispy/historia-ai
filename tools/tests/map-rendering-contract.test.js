import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const useWorldMap = read("src/map/hooks/useWorldMap.js");
const mapView = read("src/components/GameShell/MapView/MapView.jsx");
const mapViewCss = read("src/components/GameShell/MapView/MapView.css");
const provinceLayer = read("src/map/components/layers/ProvinceLayer.jsx");
const provincePolygon = read("src/map/components/ProvincePolygon.jsx");
const gpuLayer = read("src/map/rendering/gpu/ProvinceTextureLayer.jsx");
const cameraModel = read("src/map/camera/CameraModel.js");
const cameraActions = read("src/map/camera/CameraActions.js");
const cameraController = read("src/map/camera/CameraController.jsx");
const cartographyLayer = read("src/map/components/layers/CartographyLayer.jsx");
const cityLayer = read("src/map/components/layers/CityLayer.jsx");
const physicalLayer = read("src/map/components/layers/WorldPhysicalLayer.jsx");
const historicalPoliticalLayer = read("src/map/components/layers/HistoricalPoliticalRegionLayer.jsx");

// One physical coastline authority and one map viewport. The game viewport
// must not mount a second legacy/far-zoom map or empty overlay map layers.
assert.equal((worldMap.match(/<SvgRenderer\b/g) ?? []).length, 1);
assert.equal((worldMap.match(/<WorldPhysicalLayer\b[^>]*\/>/g) ?? []).length, 1);
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

// The world is finite and non-wrapping. SVG and GPU must therefore render
// exactly one 360-degree world copy at every LOD.
assert.ok(svgRenderer.includes("const zoom = Math.max(1, Number(camera.zoom ?? 1));"));
assert.ok(!svgRenderer.includes("copyCenter"));
assert.ok(!svgRenderer.includes("copies.map"));
assert.ok(gpuLayer.includes("const vertices = ["));
assert.ok(!gpuLayer.includes("for (const offset of [-360, 0, 360])"));
assert.ok(!gpuLayer.includes("[-180 + offset"));
assert.equal((gpuLayer.match(/\[-180, -90, 0, 1\]/g) ?? []).length, 2);
assert.ok(cameraModel.includes("minZoom: 1"));
assert.ok(cameraActions.includes("const horizontalRange = Math.max(0, (WORLD_WIDTH - visibleWidth) / 2);"));
assert.ok(cameraActions.includes("x: clamp(x, -horizontalRange, horizontalRange)"));

// The physical world owns the complete water/land base. Political geometry
// may only appear inside its land silhouette.
assert.match(svgRenderer, /id="world-land-mask"/);
assert.match(svgRenderer, /WORLD_LAND_PATH/);
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);
assert.match(physicalLayer, /WORLD_LAND_PATH/);
assert.match(physicalLayer, /WORLD_PHYSICAL_ATLAS\.water\.fill/);

// The historical political compositor must own its own global land clip.
// It cannot depend on a sibling renderer's clipPath definition or disappear
// when SVG definition ordering changes.
assert.ok(historicalPoliticalLayer.includes("import { WORLD_LAND_PATH } from \"../../physical/WorldPhysicalAtlas.js\";"));
assert.ok(historicalPoliticalLayer.includes("historical-world-political-land-clip"));
assert.ok(historicalPoliticalLayer.includes("<path d={WORLD_LAND_PATH} fillRule=\"evenodd\" />"));
assert.ok(historicalPoliticalLayer.includes("clipPath={`url(#${HISTORICAL_WORLD_POLITICAL_CLIP_ID})`}"));
assert.ok(!historicalPoliticalLayer.includes('clipPath="url(#world-land-mask)"'));

// A dated map must consume the dated GIS runtime geometry, not whatever
// modern/previous geometry repository happens to be attached to the session.
assert.ok(useWorldMap.includes("loadHistoricalGeometryRepository"));
assert.ok(useWorldMap.includes("loadHistoricalGeometryRepository(date) ?? sourceRepository"));
assert.ok(useWorldMap.includes("createHistoricalWorldRegions"));
assert.ok(useWorldMap.includes("getGeometries(geometryRepository)"));
assert.ok(worldMap.includes("regions={historicalRegions}"));
assert.ok(historicalPoliticalLayer.includes("HistoricalWorldRegionPaths"));
assert.ok(historicalPoliticalLayer.includes("getStableSourceColor(region.subject)"));

// The 1300 political layer must not expose a visually blank land surface when
// a source feature is absent. The land fallback is still clipped to the single
// physical coastline authority, while all available GIS regions are painted.
assert.ok(historicalPoliticalLayer.includes("Historical unassigned land presentation"));
assert.ok(historicalPoliticalLayer.includes("fill={getStableSourceColor(region.subject)}"));

// Province paths are explicit interaction surfaces. This remains true when
// GPU compositing hides the CPU fill; transparent pixels must still be clickable.
assert.ok(provincePolygon.includes("pointerEvents=\"all\""));
assert.ok(provincePolygon.includes("pointerEvents: \"all\""));
assert.ok(provincePolygon.includes("event.stopPropagation()"));

// Pointer capture is delayed until a real drag begins. Capturing on pointer
// down retargets a click to the viewport and breaks province selection.
assert.ok(cameraController.includes("origin = useRef({ x: 0, y: 0 });"));
const pointerDownStart = cameraController.indexOf("const handlePointerDown = useCallback");
const pointerDownEnd = cameraController.indexOf("  }, []);", pointerDownStart);
const pointerDownBlock = cameraController.slice(pointerDownStart, pointerDownEnd);
assert.ok(pointerDownBlock.includes("dragging.current = true"));
assert.ok(!pointerDownBlock.includes("setPointerCapture"));
assert.ok(cameraController.includes("totalDistance > 2"));
assert.ok(cameraController.includes("viewportTarget.current?.setPointerCapture?.(event.pointerId)"));

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
// political texture on every mouse-wheel/pan update. The camera effect owns
// only frame updates; raster creation remains memoized by GPU LOD/data/style.
assert.match(gpuLayer, /useEffect\(\(\) => \{\n\s{4}cameraRef\.current = camera/);
assert.match(gpuLayer, /\}, \[camera, gpuEnabled\]\);/);
assert.ok(gpuLayer.includes("renderFrame(state, camera, rect.width, rect.height)"));
assert.ok(gpuLayer.includes("useMemo(") && gpuLayer.includes("[gpuEnabled, provinces, mapStyle]"));

// CPU and GPU political fills have an explicit handoff. The dated 1300
// historical renderer is authoritative and therefore also disables the CPU
// province fill, while the GPU compositor remains available for other maps.
assert.ok(worldMap.includes("const gpuProvinceActive = useGpuProvinceFill && textureReady;"));
assert.ok(worldMap.includes("renderFill={!isHistoricalPoliticalMap && !gpuProvinceActive}"));
assert.ok(worldMap.includes("{politicalRegions}"));
assert.ok(gpuLayer.includes("Handoff happens only after the first GPU frame has been rendered"));

// Historical political presentation is explicitly connected at the render root.
assert.ok(worldMap.includes("HistoricalPoliticalRegionLayer"));
assert.ok(worldMap.includes("const isHistoricalPoliticalMap = scenarioDate === HISTORICAL_1300_DATE;"));
assert.ok(worldMap.includes("const useGpuProvinceFill = !isHistoricalPoliticalMap"));

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

console.log("Map rendering contract tests passed: one synchronized world, explicit province interaction, one physical coastline authority, complete dated political GIS handoff, and no legacy overlay layers.");
