import assert from "node:assert/strict";
import { buildRiverRibbonGeometry } from "../../src/map/rendering/water/WaterGeometry.js";
import { physicalMaskClassification } from "../../src/map/rendering/water/WaterMask.js";
import { MAP_RENDER_PASSES, PHYSICAL_MASK_CONTRACT } from "../../src/map/rendering/RenderPassGraph.js";

function finiteArray(values) {
  return values instanceof Float32Array || values instanceof Uint32Array
    ? Array.from(values).every(Number.isFinite)
    : false;
}

function diagnoseRiverGeometry(geometry) {
  const errors = [];
  if (!geometry || geometry.stride !== 8) errors.push("invalid-stride");
  if (!finiteArray(geometry?.vertices)) errors.push("non-finite-vertices");
  if (!finiteArray(geometry?.indices)) errors.push("non-finite-indices");
  const vertexCount = (geometry?.vertices?.length ?? 0) / 8;
  for (const index of geometry?.indices ?? []) {
    if (index >= vertexCount) {
      errors.push(`index-out-of-range:${index}`);
      break;
    }
  }
  for (const range of geometry?.riverRanges ?? []) {
    if (range.indexStart < 0 || range.indexCount < 6 || range.indexCount % 6 !== 0) {
      errors.push(`invalid-range:${range.id}`);
    }
    if (range.vertexStart < 0 || range.vertexCount < 4 || range.vertexCount % 2 !== 0) {
      errors.push(`invalid-vertex-range:${range.id}`);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

const geometry = buildRiverRibbonGeometry([
  { id: "diagnostic-major", rank: 1, coordinates: [[29, 40], [29.1, 40.1], [29.2, 40.15]] },
  { id: "diagnostic-minor", rank: 2, coordinates: [[30, 39], [30.2, 39.2]] },
]);
const diagnosis = diagnoseRiverGeometry(geometry);
assert.equal(diagnosis.valid, true);
assert.deepEqual(diagnosis.errors, []);
assert.ok(geometry.sourcePointCount >= geometry.renderedPointCount);
assert.ok(geometry.reductionRatio >= 0 && geometry.reductionRatio <= 1);

const land = physicalMaskClassification({ land: 1, lake: 0, sea: 0 });
const lake = physicalMaskClassification({ land: 1, lake: 1, sea: 0 });
const sea = physicalMaskClassification({ land: 0, lake: 0, sea: 1 });
assert.equal(land.allowsPolitical, true);
assert.equal(lake.allowsPolitical, false);
assert.equal(lake.allowsRiver, false);
assert.equal(sea.isWater, true);

assert.equal(MAP_RENDER_PASSES.length, 11);
assert.deepEqual(PHYSICAL_MASK_CONTRACT.channels, { land: "r", lake: "g", sea: "b", valid: "a" });
assert.ok(MAP_RENDER_PASSES.every((pass) => pass.mask === "physical"));

console.log(
  `Water engine diagnostics passed: ${geometry.riverRanges.length} rivers, `
  + `${geometry.sourcePointCount} source points, ${geometry.renderedPointCount} render points, `
  + `${(geometry.reductionRatio * 100).toFixed(2)}% reduction, physical mask contract intact.`,
);
