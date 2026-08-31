import assert from "node:assert/strict";
import { ProvinceSoA, QuadtreeIndex, buildSpatialItems } from "../../src/map/runtime/index.js";
import {
  PROVINCE_LOD,
  buildVisibilityPlan,
  getCameraViewportBounds,
  selectProvinceLod,
} from "../../src/map/runtime/GpuProvinceVisibility.js";
import { GpuProvincePipeline } from "../../src/map/rendering/gpu/GpuProvincePipeline.js";

const provinces = [
  { province: { id: "west" }, geometry: { polygons: [[[-20, -10], [0, -10], [0, 10], [-20, 10]]] } },
  { province: { id: "east" }, geometry: { polygons: [[[40, -10], [60, -10], [60, 10], [40, 10]]] } },
];

assert.equal(selectProvinceLod(1), PROVINCE_LOD.WORLD);
assert.equal(selectProvinceLod(4), PROVINCE_LOD.REGIONAL);
assert.equal(selectProvinceLod(12), PROVINCE_LOD.PROVINCE);
assert.equal(selectProvinceLod(32), PROVINCE_LOD.DETAIL);

const bounds = getCameraViewportBounds({ x: -10, y: 0, zoom: 4 }, 2);
assert.equal(bounds.minX, -55);
assert.equal(bounds.maxX, 35);
assert.equal(bounds.minY, -11.25);
assert.equal(bounds.maxY, 11.25);

const soa = new ProvinceSoA(provinces);
const index = new QuadtreeIndex(buildSpatialItems(soa));
const plan = buildVisibilityPlan(index, { x: -10, y: 0, zoom: 4 }, 1600, 800);
assert.equal(plan.lod, PROVINCE_LOD.REGIONAL);
assert.deepEqual(plan.indices, [0]);
assert.equal(plan.count, 1);

const pipeline = new GpuProvincePipeline(provinces);
const pipelinePlan = pipeline.update({ x: 50, y: 0, zoom: 16 }, 1600, 800);
assert.equal(pipelinePlan.lod, PROVINCE_LOD.PROVINCE);
assert.deepEqual(pipelinePlan.indices, [1]);
assert.equal(pipeline.provinceIdAtIndex(0), "west");
assert.equal(pipeline.provinceIdAtIndex(1), "east");
assert.equal(pipeline.provinceIdAtIndex(99), null);
assert.equal(pipeline.stats().visibleCount, 1);

console.log("GPU province pipeline tests passed: LOD selection, viewport culling, stable ID mapping.");
