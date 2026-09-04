import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rendererPath = path.join(root, "src/map/rendering/gpu/ProductionBinaryMapRenderer.js");
const physicalPath = path.join(root, "src/map/rendering/gpu/ProductionPhysicalMapLayer.js");
const diagnosticsPath = path.join(root, "src/map/rendering/gpu/MapRenderDiagnostics.js");
const terrainPath = path.join(root, "src/map/rendering/terrain/TerrainGpuRenderer.js");

const renderer = fs.readFileSync(rendererPath, "utf8");
const physical = fs.readFileSync(physicalPath, "utf8");
const diagnostics = fs.readFileSync(diagnosticsPath, "utf8");
const terrain = fs.readFileSync(terrainPath, "utf8");

assert.match(renderer, /MapRenderDiagnostics\.js/);
assert.match(renderer, /renderPoliticalProvinces/);
assert.match(physical, /renderPhysicalLand/);
assert.match(physical, /renderTerrain/);
assert.match(physical, /renderWaterAndCoast/);
assert.match(physical, /Array\.isArray\(feature\)\?feature:\[\]/);
assert.match(physical, /\[PhysicalMapLayer\] geometry counts/);
assert.match(diagnostics, /renderPhysicalLand: true/);
assert.match(diagnostics, /renderTerrain: true/);
assert.match(diagnostics, /renderWaterAndCoast: true/);
assert.match(diagnostics, /renderPoliticalProvinces: true/);
assert.match(diagnostics, /setPassEnabled/);
assert.match(diagnostics, /setAll/);
assert.match(diagnostics, /setOnly/);
assert.match(diagnostics, /togglePass/);
assert.match(diagnostics, /PASS_ALIASES/);
assert.match(diagnostics, /terrainOnly/);
assert.match(diagnostics, /toggleTerrain/);
assert.match(terrain, /skirtDepth:0/);
assert.match(terrain, /HEIGHT_MIN_METERS = -500/);
assert.match(terrain, /HEIGHT_MAX_METERS = 9000/);
assert.match(terrain, /HEIGHT_SCALE_MAX = 0\.001/);

// The production WebGL2 context must own a depth buffer because the physical
// compositor explicitly enables DEPTH_TEST and writes/reads the depth buffer.
const binaryRendererPath = path.join(root, "src/map/rendering/gpu/BinaryMapRenderer.js");
const binaryRenderer = fs.readFileSync(binaryRendererPath, "utf8");
assert.match(binaryRenderer, /getContext\("webgl2",\{[^}]*depth:true/s);

console.log("Map render diagnostics + depth context + terrain seam contracts: PASS");
