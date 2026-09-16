import assert from "node:assert/strict";
import { build1326CandidateEvidencePilot } from "../historical-gis/province/1326CandidateEvidencePilot.js";

const t3Result = {
  phase: "T3-C",
  authoritative: false,
  features: [
    {
      featureId: "bithynia-core",
      points: [
        { sourceIndex: 0, point: [29.06, 40.19], pointType: "mandatory", importance: 1, locked: true },
        { sourceIndex: 1, point: [29.72, 40.43], pointType: "constraint", importance: 0.8, locked: false },
      ],
    },
  ],
};

const adjacencyGraph = {
  version: 1,
  authoritative: false,
  nodes: [
    { id: "bursa", position: { lon: 29.06, lat: 40.19 } },
    { id: "nicaea", position: { lon: 29.72, lat: 40.43 } },
    { id: "nicomedia", position: { lon: 29.92, lat: 40.77 } },
    { id: "sangarius", position: { lon: 30.45, lat: 40.75 } },
  ],
  edges: [
    { id: "adj:bursa:nicaea", source: "bursa", target: "nicaea" },
    { id: "adj:nicaea:nicomedia", source: "nicaea", target: "nicomedia" },
    { id: "adj:nicaea:sangarius", source: "nicaea", target: "sangarius" },
  ],
};

const sampler = {
  elevation(lon, lat) {
    const dx = (lon - 29.5) * 1000;
    const dy = (lat - 40.5) * 1000;
    return 250 + dx * 0.05 + dy * 0.03 + Math.sin(lon * 20) * 2;
  },
};

const result = build1326CandidateEvidencePilot({
  t3Result,
  adjacencyGraph,
  demSampler: sampler,
});

assert.equal(result.scenarioDate, "1326-04-07");
assert.equal(result.authoritative, false);
assert.equal(result.terrainSource, "P6.2-CopernicusDemCostSampler");
assert.equal(result.diagnostics.demSamplerConnected, true);
assert.equal(result.diagnostics.candidateEdgeCount, 3);
assert.equal(result.layers.t3E.authoritative, false);
assert.equal(result.layers.p61EdgeEvidence.length, 3);
assert.ok(result.layers.p61EdgeEvidence.every((edge) => edge.candidateOnly === true));
assert.ok(result.layers.p61EdgeEvidence.every((edge) => edge.physicalSupport != null));

console.log("1326 DEM bridge integration contract passed.");
