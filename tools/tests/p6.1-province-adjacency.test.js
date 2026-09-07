import assert from "node:assert/strict";
import { buildP61Adjacency, summarizeP61Graph } from "../historical-gis/P61ProvinceAdjacency.js";

const metadata = [
  { id: "a", regionId: "west", centroid: [0, 0] },
  { id: "b", regionId: "west", centroid: [1, 0] },
  { id: "c", regionId: "west", centroid: [0, 1] },
  { id: "d", regionId: "east", centroid: [10, 0] },
];

const landPolygons = [[[-1, -1], [11, -1], [11, 2], [-1, 2]]];
const graph = buildP61Adjacency(metadata, { landPolygons });
const summary = summarizeP61Graph(graph);

assert.equal(summary.seedCount, 4);
assert.equal(summary.edgeCount, graph.edges.length);
assert.equal(summary.isolatedSeedCount, 0);
assert.equal(graph.edges.every((edge) => edge.distanceKm > 0), true);
assert.equal(graph.edges.every((edge) => edge.from !== edge.to), true);
assert.equal(graph.edges.every((edge) => edge.physicalReachable === true), true);
assert.equal(summary.degreeMin >= 1, true);
assert.equal(summary.degreeMax >= summary.degreeMin, true);
assert.equal(summary.mstEdgeCount, summary.seedCount - 1);

console.log("P6.1 province adjacency graph tests passed.");
