import assert from "node:assert/strict";
import { createCostField, costAlongPath } from "../historical-gis/province/CostField.js";
import { SpatialHashSeedIndex } from "../historical-gis/province/SpatialSeedIndex.js";
import { WeightedTessellationEngine } from "../historical-gis/province/WeightedTessellationEngine.js";

const field = createCostField({
  weights: { slope: 2, ridge: 4, mountain: 8, river: 3, lake: 5, coast: 1 },
});
const evaluation = field.evaluate({ slope: 2, ridge: 1, mountain: 0, river: 2, lake: 0, coast: 1 });
assert.equal(evaluation.total, 15);
assert.equal(evaluation.channels.ridge, 1);
assert.throws(() => field.evaluate({ slope: -1 }));

const path = costAlongPath(
  [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }, { lon: 3, lat: 0 }],
  () => ({ slope: 1 }),
  { weights: { slope: 2 } },
);
assert.equal(path.total, 6);
assert.equal(path.segments.length, 2);

const index = new SpatialHashSeedIndex({ cellSize: 5 });
index.insert({ id: "a", position: { lon: 0, lat: 0 } });
index.insert({ id: "b", position: { lon: 2, lat: 0 } });
const engine = new WeightedTessellationEngine({
  seedIndex: index,
  costField: field,
  constraintResolver: () => ({ allowed: true, costMultiplier: 2 }),
});
assert.deepEqual(engine.discoverCandidates({ id: "a", position: { lon: 0, lat: 0 } }, 5).map((seed) => seed.id), ["b"]);
const unavailable = engine.solveBoundary({
  leftSeed: { id: "a", position: { lon: 0, lat: 0 } },
  rightSeed: { id: "b", position: { lon: 2, lat: 0 } },
  start: { lon: 0, lat: 0 },
  end: { lon: 2, lat: 0 },
  sampler: () => ({ slope: 1 }),
});
assert.equal(unavailable.accepted, false);
assert.equal(unavailable.reason, "path-solver-not-installed");
console.log("Cost field contracts: PASS");
