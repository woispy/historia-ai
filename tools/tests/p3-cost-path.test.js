import assert from "node:assert/strict";
import { createCostField, costAlongPath } from "../historical-gis/province/CostField.js";
import {
  adaptDemSample,
  adaptHydrographySample,
  adaptRiverDirectionalSample,
  composeCostSamples,
} from "../historical-gis/province/CostAdapters.js";
import { CompositeCostGraph } from "../historical-gis/province/CompositeCostGraph.js";
import { LeastCostPathSolver } from "../historical-gis/province/LeastCostPathSolver.js";

const dem = adaptDemSample({ slopeDegrees: 22.5, ridgeAffinity: 1, mountainResistance: 0.25 });
assert.equal(dem.ridge, 0);
assert.equal(dem.slope, 0.5);
assert.equal(dem.mountain, 0.25);

const hydro = adaptHydrographySample({ riverPenalty: 0.8, lakePenalty: 1, coastPenalty: 0.2 });
const composed = composeCostSamples(dem, hydro);
assert.deepEqual(composed, { slope: 0.5, ridge: 0, mountain: 0.25, river: 0.8, lake: 1, coast: 0.2 });

const parallel = adaptRiverDirectionalSample({ riverNormal: { x: 1, y: 0 }, direction: { x: 0, y: 1 } });
const crossing = adaptRiverDirectionalSample({ riverNormal: { x: 1, y: 0 }, direction: { x: 1, y: 0 } });
assert.ok(parallel.river < crossing.river);

const seamCost = costAlongPath(
  [{ lon: 179, lat: 0 }, { lon: -179, lat: 0 }],
  () => ({ slope: 1 }),
  { weights: { slope: 1 } },
);
assert.equal(seamCost.total, 2);

const graph = new CompositeCostGraph({
  width: 5,
  height: 5,
  bounds: { minLon: 0, maxLon: 5, minLat: 0, maxLat: 5 },
  sampleCell: (node) => ({ total: node.x === 2 && node.y < 4 ? 20 : 1 }),
  transitionCost: (from, to, fromSample, toSample) => Math.max(fromSample.total, toSample.total),
  blocked: (node) => node.x === 2 && node.y === 2,
});
const solver = new LeastCostPathSolver({ graph, minimumCost: 1 });
const result = solver.solve({ start: { x: 0, y: 0 }, end: { x: 4, y: 4 } });
assert.ok(result.path);
assert.equal(result.path[0].id, "0,0");
assert.equal(result.path.at(-1).id, "4,4");
assert.ok(!result.path.some((node) => node.id === "2,2"));
assert.ok(result.cost > 0);

const diagonalGraph = new CompositeCostGraph({
  width: 2,
  height: 2,
  bounds: { minLon: 0, maxLon: 2, minLat: 0, maxLat: 2 },
  sampleCell: () => ({ total: 1 }),
});
const diagonal = new LeastCostPathSolver({ graph: diagonalGraph, minimumCost: 1 }).solve({ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });
assert.equal(diagonal.path.length, 2);
assert.ok(Math.abs(diagonal.cost - Math.SQRT2) < 1e-12);

const blocked = new CompositeCostGraph({
  width: 3,
  height: 1,
  bounds: { minLon: 0, maxLon: 3, minLat: 0, maxLat: 1 },
  sampleCell: () => ({ total: 1 }),
  blocked: (node) => node.x === 1,
});
const noPath = new LeastCostPathSolver({ graph: blocked }).solve({ start: { x: 0, y: 0 }, end: { x: 2, y: 0 } });
assert.equal(noPath.path, null);
assert.equal(noPath.reason, "no-path");

const field = createCostField({ weights: { slope: 2 } });
assert.equal(field.evaluate({ slope: 0.5 }).total, 1);
console.log("P3 cost adapters / composite graph / least-cost path contracts: PASS");
