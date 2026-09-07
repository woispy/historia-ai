import assert from "node:assert/strict";
import { buildP61Adjacency, summarizeP61Graph } from "../historical-gis/P61ProvinceAdjacency.js";

// Pure physical fixture: every seed belongs to a distinct parent so the
// historical-parent-local evidence path cannot contaminate this assertion.
const metadata = [
  { id: "a", regionId: "region-a", centroid: [0, 0] },
  { id: "b", regionId: "region-b", centroid: [1, 0] },
  { id: "c", regionId: "region-c", centroid: [0, 1] },
  { id: "d", regionId: "region-d", centroid: [10, 0] },
];

const landPolygons = [[[-1, -1], [11, -1], [11, 2], [-1, 2]]];
const graph = buildP61Adjacency(metadata, { landPolygons, adjacencyHints: {} });
const summary = summarizeP61Graph(graph);

assert.equal(summary.seedCount, 4);
assert.equal(summary.edgeCount, graph.edges.length);
assert.equal(summary.isolatedSeedCount, 0);
assert.equal(graph.edges.every((edge) => edge.distanceKm > 0), true);
assert.equal(graph.edges.every((edge) => edge.from !== edge.to), true);
assert.equal(graph.edges.every((edge) => edge.physicalReachable === true), true);
assert.equal(graph.edges.every((edge) => edge.evidenceClass === "physical-only"), true);
assert.equal(summary.physicalOnlyEdgeCount, summary.edgeCount);
assert.equal(summary.historicalOnlyEdges.length, 0);
assert.equal(summary.dualEvidenceEdgeCount, 0);
assert.equal(summary.evidenceClassPartitionCount, summary.edgeCount);
assert.equal(summary.degreeMin >= 1, true);
assert.equal(summary.degreeMax >= summary.degreeMin, true);
assert.equal(summary.connectivityEdgeCount, summary.seedCount - 1);
assert.equal(graph.mstConnected, true);

// The provenance fixture deliberately contains all three evidence classes:
// - a-d: historical-only (explicit historical hint, physically unreachable)
// - b-c: dual-evidence (historical hint + physical corridor)
// - a-e / b-e / c-e: physical-only (cross-parent physical candidates without a hint)
const provenanceMetadata = [
  ...metadata,
  { id: "e", regionId: "east", centroid: [1.5, 0] },
];
const provenanceLandPolygons = [[[-1, -1], [2, -1], [2, 2], [-1, 2]]];
const provenanceGraph = buildP61Adjacency(provenanceMetadata, {
  landPolygons: provenanceLandPolygons,
  adjacencyHints: {
    a: ["d"],
    b: ["c"],
  },
});
const provenanceSummary = summarizeP61Graph(provenanceGraph);

assert.equal(provenanceGraph.mstConnected, true);
assert.equal(provenanceSummary.historicalOnlyEdges.length > 0, true);
assert.equal(provenanceSummary.dualEvidenceEdgeCount > 0, true);
assert.equal(provenanceSummary.physicalOnlyEdgeCount > 0, true);
assert.equal(provenanceSummary.evidenceClassPartitionCount, provenanceSummary.edgeCount);
assert.equal(
  provenanceGraph.edges.every((edge) => ["historical-only", "physical-only", "dual-evidence"].includes(edge.evidenceClass)),
  true,
);
assert.equal(
  provenanceGraph.edges.filter((edge) => edge.evidenceClass === "historical-only")
    .every((edge) => edge.reasons.includes("historical-adjacency-hint") && !edge.physicalReachable),
  true,
);
assert.equal(
  provenanceGraph.edges.filter((edge) => edge.evidenceClass === "dual-evidence")
    .every((edge) => edge.reasons.includes("historical-adjacency-hint") && edge.physicalReachable),
  true,
);

console.log("P6.1 province adjacency graph tests passed.");
