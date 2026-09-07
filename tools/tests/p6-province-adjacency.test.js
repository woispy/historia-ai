import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";

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

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function round(value, digits = 2) {
  return value == null ? null : Number(value.toFixed(digits));
}

const edgeDistances = graph.edges.map((edge) => edge.distanceKm);
const degreeByNode = new Map(graph.nodes.map((node) => [node.id, 0]));
for (const edge of graph.edges) {
  degreeByNode.set(edge.source, degreeByNode.get(edge.source) + 1);
  degreeByNode.set(edge.target, degreeByNode.get(edge.target) + 1);
}
const degreeValues = [...degreeByNode.values()];
const medianDistance = percentile(edgeDistances, 0.5);
const absoluteDeviations = edgeDistances.map((distance) => Math.abs(distance - medianDistance));
const mad = percentile(absoluteDeviations, 0.5);
const robustOutlierThreshold = mad > 1e-9 ? medianDistance + 3 * mad : null;

// Diagnostic-only robust outlier detector. It never fails CI and does not
// claim historical wrongness. P6.2 will prune candidates against physical
// and historical constraints. MST edges outside the local radius are exposed
// explicitly because they are the highest-risk candidates.
const suspiciousEdges = graph.edges
  .filter((edge) => {
    const exceedsRadius = edge.distanceKm > graph.diagnostics.maxRadiusKm + 1e-9;
    const robustOutlier = robustOutlierThreshold != null && edge.distanceKm > robustOutlierThreshold;
    return exceedsRadius || robustOutlier;
  })
  .sort((a, b) => (b.distanceKm - a.distanceKm) || a.id.localeCompare(b.id))
  .map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    distanceKm: round(edge.distanceKm),
    hierarchyRelation: edge.hierarchyRelation,
    discovery: edge.discovery,
    reason: edge.distanceKm > graph.diagnostics.maxRadiusKm + 1e-9
      ? "outside-local-radius"
      : "robust-distance-outlier",
  }));

const sampleEdges = graph.edges
  .slice()
  .sort((a, b) => (a.distanceKm - b.distanceKm) || a.id.localeCompare(b.id))
  .slice(0, 20)
  .map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    distanceKm: round(edge.distanceKm),
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
  distanceKm: {
    min: round(percentile(edgeDistances, 0)),
    median: round(medianDistance),
    p90: round(percentile(edgeDistances, 0.9)),
    max: round(percentile(edgeDistances, 1)),
  },
  degree: {
    min: round(percentile(degreeValues, 0)),
    median: round(percentile(degreeValues, 0.5)),
    p90: round(percentile(degreeValues, 0.9)),
    max: round(percentile(degreeValues, 1)),
  },
  robustDistanceOutlierThresholdKm: round(robustOutlierThreshold),
  suspiciousEdgeCount: suspiciousEdges.length,
  suspiciousEdges,
  sampleEdges,
};

const telemetry = `P6.1 ANATOLIA ADJACENCY GRAPH TELEMETRY: ${JSON.stringify(summary)}`;
console.log(telemetry);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "## P6.1 Anatolia Adjacency Graph Telemetry",
    "",
    `- Authoritative: \`${graph.authoritative}\``,
    `- Seeds: **${summary.seedCount}**`,
    `- Edges: **${summary.edgeCount}** (local ${summary.localEdgeCount}, connectivity ${summary.connectivityEdgeCount})`,
    `- Hierarchy: same-parent ${summary.sameParentEdgeCount}, cross-parent ${summary.crossParentEdgeCount}`,
    `- Distance km: min ${summary.distanceKm.min}, median ${summary.distanceKm.median}, P90 ${summary.distanceKm.p90}, max ${summary.distanceKm.max}`,
    `- Degree: min ${summary.degree.min}, median ${summary.degree.median}, P90 ${summary.degree.p90}, max ${summary.degree.max}`,
    `- Robust diagnostic outlier threshold: ${summary.robustDistanceOutlierThresholdKm ?? "n/a"} km`,
    `- Suspicious candidates: **${summary.suspiciousEdgeCount}**`,
    "",
    "### Suspicious candidates",
    "",
    "| Edge | Source | Target | km | Relation | Discovery | Reason |",
    "| --- | --- | --- | ---: | --- | --- | --- |",
    ...suspiciousEdges.map((edge) => `| ${edge.id} | ${edge.source} | ${edge.target} | ${edge.distanceKm} | ${edge.hierarchyRelation} | ${edge.discovery} | ${edge.reason} |`),
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n", "utf8");
}
