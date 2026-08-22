import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCameraCullingKey, getCameraCullingSnapshot } from "../../src/map/rendering/MapViewportCulling.js";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const cameraController = read("src/map/camera/CameraController.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const cityLayer = read("src/map/components/layers/CityLayer.jsx");
const physicalLayer = read("src/map/components/layers/PhysicalGeographyLayer.jsx");
const provincePolygon = read("src/map/components/ProvincePolygon.jsx");
const provinceBoundary = read("src/map/components/layers/ProvinceBoundaryLayer.jsx");

// Far-world motion should not churn expensive geometry visibility/layout work.
assert.equal(getCameraCullingKey({ x: 0, y: 0, zoom: 1 }), "world");
assert.equal(getCameraCullingKey({ x: 40, y: 20, zoom: 1.15 }), "world");

const first = getCameraCullingSnapshot({ x: 0, y: 0, zoom: 2 });
const nearby = getCameraCullingSnapshot({ x: first.x + 1, y: first.y + 1, zoom: 2 });
assert.deepEqual(nearby, first);

// A meaningful movement must eventually invalidate the coarse snapshot.
const moved = getCameraCullingSnapshot({ x: first.x + 25, y: first.y, zoom: 2 });
assert.notDeepEqual(moved, first);

// Wheel input is coalesced to animation frames rather than issuing one React
// state update per browser wheel event.
assert.ok(cameraController.includes("pendingZoom"));
assert.ok(cameraController.includes("requestAnimationFrame(flushFrame)"));
assert.ok(cameraController.includes("pendingZoom.current += delta"));

// Camera motion must use the coarse snapshot for expensive SVG visibility work;
// the GPU compositor still receives the continuous camera state.
assert.ok(worldMap.includes("getCameraCullingKey(cameraState)"));
assert.ok(worldMap.includes("getCameraCullingSnapshot(cameraState)"));
assert.ok(worldMap.includes("camera={cullingCamera}"));
assert.ok(worldMap.includes("camera={cameraState}"));

// Expensive static SVG geometry must be memoized across pure camera motion.
assert.ok(provincePolygon.includes("memo(ProvincePolygon)"));
assert.ok(provinceBoundary.includes("export default memo(ProvinceBoundaryLayer"));
assert.ok(cityLayer.includes("cities.map(mergeCityMetadata)"));
assert.ok(cityLayer.includes("export default memo(CityLayer"));
assert.ok(physicalLayer.includes("export default memo(PhysicalGeographyLayer"));

console.log("Map performance regression tests passed: wheel coalescing, coarse culling, and static SVG memoization are active.");
