import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const gameShell = read("src/components/GameShell/GameShell.jsx");
const mapView = read("src/components/GameShell/MapView/MapView.jsx");
const worldMap = read("src/map/components/WorldMap.jsx");
const provinceLayer = read("src/map/components/layers/ProvinceLayer.jsx");
const provincePolygon = read("src/map/components/ProvincePolygon.jsx");
const inspector = read("src/components/GameShell/MapView/ProvinceInspector.jsx");
const cameraController = read("src/map/camera/CameraController.jsx");

// Province selection is a runtime UI concern, not persisted simulation state.
// GameShell owns the selection and passes it through MapView -> WorldMap ->
// ProvinceLayer -> ProvincePolygon.
assert.ok(gameShell.includes("const [selectedProvinceId, setSelectedProvinceId] = useState(null);"));
assert.ok(gameShell.includes("selectedProvinceId={selectedProvinceId}"));
assert.ok(gameShell.includes("onProvinceClick={handleProvinceClick}"));
assert.ok(mapView.includes("selectedProvinceId = null"));
assert.ok(mapView.includes("onProvinceClick"));
assert.ok(mapView.includes("<ProvinceInspector"));
assert.ok(worldMap.includes("selectedProvinceId"));
assert.ok(worldMap.includes("onProvinceClick"));
assert.ok(provinceLayer.includes("selected={province.id === selectedProvinceId}"));
assert.ok(provincePolygon.includes("onClick={(event) =>"));
assert.ok(provincePolygon.includes("onClick?.(province.id)"));
assert.ok(provincePolygon.includes("pointerEvents=\"all\""));

// Clicking the selected province again closes the inspector rather than
// leaving an unreachable selection behind.
assert.ok(gameShell.includes("currentId === provinceId ? null : provinceId"));

// A click must remain a click: camera pointer capture begins only after the
// drag threshold, otherwise the viewport can swallow province click events.
const pointerDownBlock = cameraController.match(/const handlePointerDown = useCallback\(\(event\) => \{([\s\S]*?)\n  \}, \[\]\);/)?.[1] ?? "";
assert.ok(!pointerDownBlock.includes("setPointerCapture"));
assert.ok(cameraController.includes("totalDistance > 2"));

// The inspector is presentation-only: it consumes the existing province
// ViewModel pipeline and never mutates the simulation/runtime session.
assert.ok(inspector.includes("createProvincePanelViewModel"));
assert.ok(!inspector.includes("updateCurrentGame"));
assert.ok(!inspector.includes("GameEngine"));

console.log("Province selection contract tests passed: map click, selection highlight and inspector wiring are connected end-to-end.");
