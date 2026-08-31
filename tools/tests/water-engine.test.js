import assert from "node:assert/strict";
import { MAP_RENDER_PASSES, PHYSICAL_MASK_CONTRACT, assertPhysicalMaskPass } from "../../src/map/rendering/RenderPassGraph.js";
import { buildRiverRibbonGeometry, getRiverGpuDrawCount } from "../../src/map/rendering/water/WaterGeometry.js";
import { physicalMaskClassification } from "../../src/map/rendering/water/WaterMask.js";
import { RIVER_FRAGMENT_SHADER, RIVER_VERTEX_SHADER, WATER_SURFACE_FRAGMENT_SHADER } from "../../src/map/rendering/water/WaterShaders.js";

assert.equal(MAP_RENDER_PASSES.length, 11);
assert.deepEqual(MAP_RENDER_PASSES.map((pass) => pass.id), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.ok(MAP_RENDER_PASSES.every((pass) => pass.mask === "physical"));
assert.equal(PHYSICAL_MASK_CONTRACT.channels.land, "r");
assert.equal(PHYSICAL_MASK_CONTRACT.channels.lake, "g");
assert.equal(PHYSICAL_MASK_CONTRACT.channels.sea, "b");
assert.doesNotThrow(() => MAP_RENDER_PASSES.forEach(assertPhysicalMaskPass));

const geometry = buildRiverRibbonGeometry([
  { id: "major", rank: 1, coordinates: [[29, 40], [29.1, 40.1], [29.2, 40.15]] },
  { id: "minor", rank: 2, coordinates: [[30, 39], [30.2, 39.2]] },
]);
assert.equal(geometry.stride, 8);
assert.equal(geometry.vertices.length, 10 * 8);
assert.equal(geometry.indices.length, 18);
assert.equal(geometry.riverRanges.length, 2);
assert.equal(getRiverGpuDrawCount(geometry), 1);
assert.ok(geometry.vertices.some((value) => value !== 0));

const land = physicalMaskClassification({ land: 1, lake: 0, sea: 0 });
assert.equal(land.allowsPolitical, true);
assert.equal(land.allowsTerrain, true);
assert.equal(land.allowsRiver, true);

const lake = physicalMaskClassification({ land: 1, lake: 1, sea: 0 });
assert.equal(lake.allowsPolitical, false);
assert.equal(lake.allowsTerrain, false);
assert.equal(lake.allowsRiver, false);

const sea = physicalMaskClassification({ land: 0, lake: 0, sea: 1 });
assert.equal(sea.allowsPolitical, false);
assert.equal(sea.isWater, true);

assert.match(RIVER_VERTEX_SHADER, /aFlow/);
assert.match(RIVER_VERTEX_SHADER, /aWidth/);
assert.match(RIVER_VERTEX_SHADER, /aUv/);
assert.match(RIVER_FRAGMENT_SHADER, /uFlowSpeed/);
assert.match(RIVER_FRAGMENT_SHADER, /uNormalMap/);
assert.match(RIVER_FRAGMENT_SHADER, /uPhysicalMask/);
assert.match(WATER_SURFACE_FRAGMENT_SHADER, /fresnel/i);
assert.match(WATER_SURFACE_FRAGMENT_SHADER, /uRoughness/);
assert.match(WATER_SURFACE_FRAGMENT_SHADER, /shorelineFoam/);

console.log("Water Engine contract tests passed.");
