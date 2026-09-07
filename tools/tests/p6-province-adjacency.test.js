import assert from "node:assert/strict";

import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { validateProvinceSeedSet } from "../historical-gis/province/ProvinceSeedModel.js";
import { buildProvinceAdjacencyGraph, validateProvinceAdjacencyGraph } from "../historical-gis/province/ProvinceAdjacencyGraph.js";

const seeds = validateProvinceSeedSet(ANATOLIA_PROVINCE_METADATA.map((item) => ({
  id: item.id,
  identity: { key: item.id, name: item.name, type: "province" },
  position: { lon: item.centroid[0], lat: item.centroid[1] },
  historical: {
    validFrom: 1300,
    validTo: null,
    sourceIds: [`anatolia-metadata:${item.id}`],
    confidence: {
      existence: item.historicalControl.confidence === "high" ? 1 : item.historicalControl.confidence === "medium" ? 0.75 : 0.5,
      location: 0.95,
      extent: item.borderConfidence === "high" ? 0.85 : item.borderConfidence === "medium" ? 0.65 : 0.4,
      boundary: item.borderConfidence === "high" ? 0.8 : 0.35,
      ownership: item.historicalControl.controllerAt1300 ? 0.8 : 0.35,
    },
  },
  hierarchy: { parentId: item.regionId, ancestry: [item.regionId] },
  constraints: {
    boundaryMode: item.borderConfidence === "high" ? "soft" : "inferred",
    physical: { landOnly: true, avoidWater: true, riverCrossingCost: 3.5, mountainCrossingCost: 5, ridgeAffinity: 8, coastAffinity: 2 },
  },
})));

const graph = buildProvinceAdjacencyGraph(seeds, {
  cellSize: 1,
  maxRadiusKm: 350,
  maxNeighbors: 4,
});
const validation = validateProvinceAdjacencyGraph(graph);

assert.equal(validation.valid, true);
assert.equal(graph.nodes.length, seeds.length);
assert.ok(graph.edges.length >= graph.nodes.length - 1, "candidate graph must be connected");
assert.ok(graph.diagnostics.localEdgeCount > 0, "local physical-proximity candidates must exist");
assert.ok(graph.diagnostics.sameParentEdgeCount > 0, "same-region candidate relationships must exist");
assert.ok(graph.diagnostics.crossParentEdgeCount > 0, "cross-region candidate relationships must exist");
assert.ok(graph.edges.every((edge) => edge.distanceKm <= 350 || edge.discovery === "connectivity-mst"));

const sampleEdges = graph.edges
  .slice()
  .sort((a, b) => (a.distanceKm - b.distanceKm) || a.id.localeCompare(b.id))
  .slice(0, 20)
  .map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    distanceKm: Number(edge.distanceKm.toFixed(2)),
    hierarchyRelation: edge.hierarchyRelation,
    discovery: edge.discovery,
  }));

const summary = {
  version: graph.version,
  authoritative: graph.authoritative,
  seedCount: graph.diagnostics.seedCount,
  edgeCount: graph.diagnostics.edgeCount,
  localEdgeCount: graph.diagnostics.localEdgeCount,
  connectivityEdgeCount: graph.diagnostics.connectivityEdgeCount,
  sameParentEdgeCount: graph.diagnostics.sameParentEdgeCount,
  crossParentEdgeCount: graph.diagnostics.crossParentEdgeCount,
  sampleEdges,
};

console.log(`P6.1 ANATOLIA ADJACENCY GRAPH: ${JSON.stringify(summary)}`);
