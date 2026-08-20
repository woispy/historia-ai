import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const cartographyModel = read("src/map/rendering/CartographyModel.js");
const worldMap = read("src/map/components/WorldMap.jsx");
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
const cityInspector = read("src/components/GameShell/MapView/CityInspector.jsx");

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

assert.match(svgRenderer, /id="world-land-mask"/);
assert.match(svgRenderer, /WORLD_LAND_PATH/);
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);
assert.match(physicalLayer, /WORLD_LAND_PATH/);
assert.match(physicalLayer, /WORLD_PHYSICAL_ATLAS\.water\.fill/);

assert.ok(provincePolygon.includes("pointerEvents=\"all\""));
assert.ok(provincePolygon.includes("pointerEvents: \"all\""));
assert.ok(provincePolygon.includes("event.stopPropagation()"));

// Far-zoom performance: GPU political fill remains active while expensive
// SVG province hit paths are removed until province-level zoom.
assert.ok(provinceLayer.includes("const interactionActive = zoom >= MAP_LOD.province.min || Boolean(selectedProvinceId);"));
assert.ok(provinceLayer.includes("if (!interactionActive) return [];"));
assert.ok(cartographyModel.includes("return Number(zoom) < 4.5;"));
assert.ok(cartographyModel.includes("fillOpacity: 1"));
assert.ok(cartographyModel.includes('maxLabels: lod === "world" || lod === "regional" ? 0'));

assert.ok(cameraController.includes("origin = useRef({ x: 0, y: 0 });"));
const pointerDownStart = cameraController.indexOf("const handlePointerDown = useCallback");
const pointerDownEnd = cameraController.indexOf("  }, []);", pointerDownStart);
const pointerDownBlock = cameraController.slice(pointerDownStart, pointerDownEnd);
assert.ok(pointerDownBlock.includes("dragging.current = true"));
assert.ok(!pointerDownBlock.includes("setPointerCapture"));
assert.ok(cameraController.includes("totalDistance > 2"));
assert.ok(cameraController.includes("viewportTarget.current?.setPointerCapture?.(event.pointerId)"));

assert.ok(gpuLayer.includes("globalCompositeOperation = \"destination-in\""));
assert.ok(gpuLayer.includes("applyLandMask(provinceContext, landCanvas)"));
assert.ok(gpuLayer.includes("if (texture(uLandMask, vUv).r < 0.5) discard;"));
assert.ok(gpuLayer.includes("if (encodedProvince.a < 0.5) discard;"));
assert.ok(gpuLayer.includes("if (provinceId < 0.5) discard;"));
assert.ok(!gpuLayer.includes("uWaterColor"));
assert.ok(!gpuLayer.includes("uLandColor"));
assert.ok(gpuLayer.includes("createTexture(gl, raster.landCanvas, false)"));

assert.match(gpuLayer, /useEffect\(\(\) => \{\n\s{4}cameraRef\.current = camera/);
assert.match(gpuLayer, /\}, \[camera, gpuEnabled\]\);/);
assert.ok(gpuLayer.includes("renderFrame(state, camera, rect.width, rect.height)"));
assert.ok(gpuLayer.includes("useMemo(") && gpuLayer.includes("[gpuEnabled, provinces, mapStyle]"));

assert.ok(worldMap.includes("const gpuProvinceActive = useGpuProvinceFill && textureReady;"));
assert.ok(worldMap.includes("renderFill={!gpuProvinceActive}"));
assert.ok(gpuLayer.includes("Handoff happens only after the first GPU frame has been rendered"));

// City interaction must produce UI state in addition to camera focus.
assert.ok(worldMap.includes("onCityClick={onCityClick}"));
assert.ok(worldMap.includes("onCityClick?.(cityId)"));
assert.ok(mapView.includes("onCityClick={handleCityClick}"));
assert.ok(mapView.includes("const [selectedCityId, setSelectedCityId] = useState(null);"));
assert.ok(mapView.includes("<CityInspector"));
assert.ok(cityInspector.includes("aria-label=\"Şehir bilgileri\""));
assert.ok(cityInspector.includes("city.population"));
assert.ok(cityInspector.includes("city.prosperity"));
assert.ok(cityInspector.includes("city.food"));
assert.ok(cityInspector.includes("city.loyalty"));

assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CORRIDORS"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_PASSES"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CROSSINGS"));
assert.ok(!cityLayer.includes("strokeDasharray"));
assert.ok(!cityLayer.includes("port &&"));
assert.ok(!cityLayer.includes("fortified &&"));
assert.ok(!worldMap.includes('phase="base"'));
assert.ok(!worldMap.includes('phase="water"'));

console.log("Map rendering contract tests passed: stable political LOD, far-zoom culling, and end-to-end city interaction.");
