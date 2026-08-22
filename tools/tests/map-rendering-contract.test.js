import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const svgRenderer = read("src/map/rendering/SvgRenderer.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const useWorldMap = read("src/map/hooks/useWorldMap.js");
const geometryBootstrap = read("src/world/map/geometry/GeometryBootstrap.js");
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

// One physical coastline authority and one map viewport. The game viewport
// must not mount a second legacy/far-zoom map or empty overlay map layers.
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

// The world is finite and non-wrapping. SVG therefore renders exactly one
// 360-degree world copy at every LOD.
assert.ok(svgRenderer.includes("const zoom = Math.max(1, Number(camera.zoom ?? 1));"));
assert.ok(!svgRenderer.includes("copyCenter"));
assert.ok(!svgRenderer.includes("copies.map"));
assert.ok(cameraModel.includes("minZoom: 1"));
assert.ok(cameraActions.includes("const horizontalRange = Math.max(0, (WORLD_WIDTH - visibleWidth) / 2);"));
assert.ok(cameraActions.includes("x: clamp(x, -horizontalRange, horizontalRange)"));

// The physical world owns the complete water/land base. Heavy land geometry
// is loaded by the physical layer, which also owns the shared land clip-path.
// Political geometry must never pull the global geometry into SVG bootstrap.
assert.ok(!svgRenderer.includes("world-land-mask"));
assert.ok(!svgRenderer.includes("WORLD_LAND_PATH"));
assert.match(provinceLayer, /clipPath="url\(#world-land-mask\)"/);
assert.match(physicalLayer, /id="world-land-mask"/);
assert.match(physicalLayer, /WORLD_LAND_PATH/);
assert.match(physicalLayer, /WORLD_PHYSICAL_ATLAS\.water\.fill/);
assert.match(physicalLayer, /import\("\.\.\/\.\.\/physical\/WorldPhysicalAtlasRuntime\.js"\)/);

// WorldMap receives a session whose MapFactory geometry descriptor is
// intentionally deferred. The browser loader is asynchronous because
// historical runtime regions are lazy-loaded; the hook must wait for the
// repository before dereferencing geometry IDs and must ignore stale results.
assert.match(useWorldMap, /import \{ bootstrapGeometry \} from "\.\.\/\.\.\/world\/map\/geometry\/GeometryBootstrap\.js";/);
assert.match(useWorldMap, /useEffect/);
assert.match(useWorldMap, /bootstrapGeometry\(scenarioDate\)/);
assert.match(useWorldMap, /\.then\(\(repository\) =>/);
assert.match(useWorldMap, /if \(ignore\) return;/);
assert.match(useWorldMap, /if \(!geometryRepository\)/);
assert.match(geometryBootstrap, /export async function bootstrapGeometry/);
assert.match(geometryBootstrap, /await loadHistoricalGeometryRepository\(date\)/);

// Province paths remain explicit interaction surfaces.
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

// Political fills use the CPU province layer plus the historical political
// layer. The obsolete GPU province compositor is intentionally no longer a
// render path, avoiding a second coastline authority and duplicate fill logic.
assert.ok(worldMap.includes("renderFill={!isHistoricalPoliticalMap}"));
assert.ok(!worldMap.includes("textureReady"));

// Strategic corridors/passes/crossings remain data anchors, not base-map
// decorations. Their old coloured line/dot renderer must stay disabled.
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CORRIDORS"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_PASSES"));
assert.ok(!cartographyLayer.includes("ANATOLIA_STRATEGIC_CROSSINGS"));

// City presentation is intentionally reduced to clean city/capital markers.
assert.ok(!cityLayer.includes("strokeDasharray"));
assert.ok(!cityLayer.includes("port &&"));
assert.ok(!cityLayer.includes("fortified &&"));

// The old no-op physical phases must not be mounted as extra map layers.
assert.ok(!worldMap.includes('phase="base"'));
assert.ok(!worldMap.includes('phase="water"'));

console.log("Map rendering contract tests passed: one synchronized world, explicit province interaction, one lazy physical coastline authority, async deferred geometry bootstrap with stale-response guard, and no obsolete GPU province compositor.");
