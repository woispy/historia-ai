import assert from "node:assert/strict";
import { GpuMapEngine } from "../../src/map/runtime/GpuMapEngine.js";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";
import { encodeGpuProvincePack } from "../../src/map/rendering/gpu/GpuProvincePackFormat.js";

assert.equal(typeof GpuMapEngine, "function");
const pack = buildIndexedProvincePack([{ province: { id: "p0" }, geometry: { polygons: [[[0,0],[10,0],[10,10],[0,10]]] } }]);
const binary = encodeGpuProvincePack(pack);
const canvas = { width: 640, height: 480, getContext() { return null; } };
assert.throws(() => new GpuMapEngine(canvas), /requires WebGL2/);
const mockCanvas = { width: 640, height: 480, getContext() { return { }; } };
assert.throws(() => new GpuMapEngine(mockCanvas), /requires WebGL2/);
assert.ok(binary.byteLength > 32);
console.log("GPU MapEngine contract passed: live engine export and HGPU input contract are present.");
