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
const inspector = read("src/components/GameShell/MapView/ProvinceInspector.jsx");

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

assert.ok(historicalPoliticalLayer.includes("import { ANATOLIA_PHYSICAL_ATLAS } from \"../../data/AnatoliaPhysicalAtlas.js\";"));
assert.ok(historicalPoliticalLayer.includes("import { WORLD_LAND_PATH } from \"../../physical/WorldPhysicalAtlas.js\";"));
assert.ok(historicalPoliticalLayer.includes("historical-world-political-land-clip"));
assert.ok(historicalPoliticalLayer.includes("historical-world-source-outside-anatolia-clip"));
assert.ok(historicalPoliticalLayer.includes("<path d={WORLD_LAND_PATH} fillRule=\"evenodd\" />"));
assert.ok(historicalPoliticalLayer.includes("${WORLD_LAND_PATH} ${ANATOLIA_LAND_PATH}"));
assert.ok(historicalPoliticalLayer.includes("clipPath={`url(#${HISTORICAL_WORLD_SOURCE_CLIP_ID})`}"));
assert.ok(historicalPoliticalLayer.includes("clipPath={`url(#${HISTORICAL_WORLD_POLITICAL_CLIP_ID})`}"));
assert.ok(!historicalPoliticalLayer.includes('clipPath="url(#world-land-mask)"'));

assert.ok(useWorldMap.includes("loadHistoricalGeometryRepository"));
assert.ok(useWorldMap.includes("createHistoricalWorldRegions"));
assert.ok(useWorldMap.includes("getGeometries(geometryRepository)"));
assert.ok(worldMap.includes("regions={historicalRegions}"));
assert.ok(historicalPoliticalLayer.includes("HistoricalWorldRegionPaths"));
assert.ok(historicalPoliticalLayer.includes("getStableSourceColor(region.subject)"));

// Global source GIS is rendered outside the curated Anatolia physical land
// polygon. This is the renderer-level inverse of the old Phase 2D land clip.
assert.ok(historicalPoliticalLayer.includes("ANATOLIA_LAND_PATH"));
assert.ok(historicalPoliticalLayer.includes("HISTORICAL_WORLD_SOURCE_CLIP_ID"));
assert.ok(historicalPoliticalLayer.includes("<HistoricalWorldRegionPaths regions={regions} />"));
assert.ok(!historicalPoliticalLayer.includes("return !subject || !SOURCE_POLITICAL_ALIASES.has(subject);"));

assert.ok(historicalPoliticalLayer.includes("<g clipPath={`url(#${HISTORICAL_WORLD_POLITICAL_CLIP_ID})`}>") );
assert.ok(!historicalPoliticalLayer.includes("COASTAL_POLITICAL_EXPANSION"));
assert.ok(historicalPoliticalLayer.includes("Historical unassigned land presentation"));

assert.ok(provincePolygon.includes("pointerEvents=\"all\""));
assert.ok(provincePolygon.includes("pointerEvents: \"all\""));
assert.ok(provincePolygon.includes("event.stopPropagation()"));

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
assert.ok(worldMap.includes("renderFill={!isHistoricalPoliticalMap && !gpuProvinceActive}"));
assert.ok(worldMap.includes("{politicalRegions}"));
assert.ok(worldMap.includes("const isHistoricalPoliticalMap = scenarioDate === HISTORICAL_1300_DATE;"));
assert.ok(worldMap.includes("const useGpuProvinceFill = !isHistoricalPoliticalMap"));

// The inspector must use dated historical ownership for the 1300 scenario,
// never the modern Admin-0 owner stored on the gameplay province. It must also
// work for curated provinces that exist only in the historical geometry repo.
assert.ok(mapView.includes("getProvinceMetadata"));
assert.ok(mapView.includes("getHistoricalPolity"));
assert.ok(mapView.includes("createHistoricalInspectorProvince"));
assert.ok(mapView.includes("repositoryProvince ?? createHistoricalInspectorProvince(historicalMetadata)"));
assert.ok(mapView.includes("historicalMetadata={historicalMetadata}"));
assert.ok(inspector.includes("historicalMetadata?.historicalControl"));
assert.ok(inspector.includes("const displayOwner = historicalMetadata"));
assert.ok(inspector.includes("1300 Kontrolü"));
assert.ok(inspector.includes("Tarihsel Güven"));

assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CORRIDORS"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_PASSES"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CROSSINGS"));
assert.ok(!cityLayer.includes("strokeDasharray"));
assert.ok(!cityLayer.includes("port &&"));
assert.ok(!cityLayer.includes("fortified &&"));
assert.ok(!worldMap.includes('phase="base"'));
assert.ok(!worldMap.includes('phase="water"'));

console.log("Map rendering contract tests passed: one synchronized world, explicit province interaction, one physical coastline authority, authoritative Anatolia political compositor, historical inspector handoff, and no legacy overlay layers.");
