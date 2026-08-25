import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const useWorldMap = read("src/map/hooks/useWorldMap.js");
const historicalPoliticalLayer = read("src/map/components/layers/HistoricalPoliticalRegionLayer.jsx");
const geometryBootstrap = read("src/world/map/geometry/GeometryBootstrap.js");
const historicalGeometryLoader = read("src/world/map/geometry/loader/HistoricalGeometryRepositoryLoader.js");
const mapView = read("src/components/GameShell/MapView/MapView.jsx");
const mapViewCss = read("src/components/GameShell/MapView/MapView.css");
const provinceLayer = read("src/map/components/layers/ProvinceLayer.jsx");
const provincePolygon = read("src/map/components/ProvincePolygon.jsx");
const cameraModel = read("src/map/camera/CameraModel.js");
const cameraActions = read("src/map/camera/CameraActions.js");
const cameraController = read("src/map/camera/CameraController.jsx");
const cartographyLayer = read("src/map/components/layers/CartographyLayer.jsx");
const cityLayer = read("src/map/components/layers/CityLayer.jsx");
const physicalLayer = read("src/map/components/layers/WorldPhysicalLayer.jsx");
const physicalRuntime = read("src/map/physical/WorldPhysicalAtlasRuntime.js");

assert.equal((worldMap.match(/<SvgRenderer\b/g) ?? []).length, 1);
assert.equal((worldMap.match(/<WorldPhysicalLayer\b[^>]*\/>/g) ?? []).length, 1);
assert.equal((mapView.match(/<WorldMap\b/g) ?? []).length, 1);
assert.ok(!worldMap.includes("ProvinceTextureLayer"));
assert.ok(!worldMap.includes("shouldUseGpuProvinceFill"));
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
assert.ok(cameraModel.includes("minZoom: 1"));
assert.ok(cameraActions.includes("const horizontalRange = Math.max(0, (WORLD_WIDTH - visibleWidth) / 2);"));
assert.ok(cameraActions.includes("x: clamp(x, -horizontalRange, horizontalRange)"));

assert.ok(!svgRenderer.includes("world-land-mask"));
assert.ok(!svgRenderer.includes("WORLD_LAND_PATH"));
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);
assert.match(physicalLayer, /id="world-land-mask"/);
assert.match(physicalLayer, /loadWorldLandPath/);
assert.ok(!physicalLayer.includes("WORLD_LAND_PATH"));
assert.match(physicalLayer, /WORLD_PHYSICAL_ATLAS\.water\.fill/);
assert.match(physicalLayer, /import\("\.\.\/\.\.\/physical\/WorldPhysicalAtlasRuntime\.js"\)/);
assert.match(physicalRuntime, /export async function loadWorldLandPath/);
assert.match(physicalRuntime, /return buildWorldPath\(collectWorldLandPolygons/);
assert.ok(!physicalRuntime.includes("export const WORLD_LAND_PATH"));

assert.match(useWorldMap, /import \{ bootstrapGeometry \} from "\.\.\/\.\.\/world\/map\/geometry\/GeometryBootstrap\.js";/);
assert.match(useWorldMap, /useEffect/);
assert.match(useWorldMap, /bootstrapGeometry\(scenarioDate\)/);
assert.match(useWorldMap, /\.then\(\(repository\) =>/);
assert.match(useWorldMap, /if \(ignore\) return;/);
assert.match(useWorldMap, /if \(!geometryRepository\)/);
assert.match(geometryBootstrap, /export async function bootstrapGeometry/);
assert.match(geometryBootstrap, /await loadHistoricalGeometryRepository\(date\)/);
assert.match(historicalGeometryLoader, /export async function loadHistoricalGeometryRepository/);
assert.match(historicalGeometryLoader, /await loadHistoricalRuntimeAsset\(date\)/);

// Historical political geometry has two explicit scopes. The curated Anatolia
// provinces use the P0 physical atlas; source-derived world regions use the
// canonical global land-mask contract. The renderer may consume that contract
// indirectly, but must not hard-code an implementation detail in this layer.
assert.match(useWorldMap, /geometryAuthority: "anatolia-curated"/);
assert.match(useWorldMap, /geometryAuthority: "world-source"/);
assert.match(historicalPoliticalLayer, /geometryAuthority === "anatolia-curated"/);
assert.match(historicalPoliticalLayer, /HISTORICAL_POLITICAL_COVERAGE_CONTRACT\.landClip/);
assert.match(historicalPoliticalLayer, /return `url\(#\$\{HISTORICAL_POLITICAL_WORLD_LAND_CLIP_ID\}\)`;/);
assert.match(historicalPoliticalLayer, /fillOpacity="0\.24"/);

assert.ok(provincePolygon.includes("pointerEvents=\"all\""));
assert.ok(provincePolygon.includes("pointerEvents: \"all\""));
assert.ok(provincePolygon.includes("event.stopPropagation()"));

assert.ok(cameraController.includes("origin = useRef({ x: 0, y: 0 });"));
const pointerDownStart = cameraController.indexOf("const handlePointerDown = useCallback");
const pointerDownEnd = cameraController.indexOf("  }, []);", pointerDownStart);
const pointerDownBlock = cameraController.slice(pointerDownStart, pointerDownEnd);
assert.ok(pointerDownBlock.includes("dragging.current = true"));
assert.ok(!pointerDownBlock.includes("setPointerCapture"));
assert.ok(cameraController.includes("totalDistance > 2"));
assert.ok(cameraController.includes("viewportTarget.current?.setPointerCapture?.(event.pointerId)"));

assert.ok(worldMap.includes("renderFill={!isHistoricalPoliticalMap}"));
assert.ok(!worldMap.includes("textureReady"));

assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CORRIDORS"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_PASSES"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CROSSINGS"));

assert.ok(!cityLayer.includes("strokeDasharray"));
assert.ok(!cityLayer.includes("port &&"));
assert.ok(!cityLayer.includes("fortified &&"));

assert.ok(!worldMap.includes('phase="base"'));
assert.ok(!worldMap.includes('phase="water"'));

console.log("Map rendering contract tests passed: one synchronized world, explicit province interaction, one lazy physical coastline authority, async deferred geometry bootstrap with stale-response guard, historical political scope separation, and no obsolete GPU province compositor.");
