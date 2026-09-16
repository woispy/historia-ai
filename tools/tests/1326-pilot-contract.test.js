import test from "node:test";
import assert from "node:assert/strict";
import { buildAdaptiveReferencePointGraph } from "../historical-gis/T3AdaptiveReferencePointEngine.js";
import { buildProvinceAdjacencyGraph } from "../historical-gis/province/ProvinceAdjacencyGraph.js";
import { build1326CandidateEvidencePilot } from "../historical-gis/province/1326CandidateEvidencePilot.js";

test("1326 pilot emits review evidence only", () => {
  const t3 = buildAdaptiveReferencePointGraph({
    source: { id: "pilot-1326", detailLevel: "medium" },
    features: [{ id: "sangarius", class: "RIVER", geometry: [[29, 40], [29.5, 40.1], [30, 40.3]] }],
  });
  const graph = buildProvinceAdjacencyGraph([
    { id: "bursa", identity: { name: "Bursa" }, position: { lon: 29.06, lat: 40.19 }, historical: { confidence: { overall: 1 } } },
    { id: "nicaea", identity: { name: "Nicaea" }, position: { lon: 29.72, lat: 40.43 }, historical: { confidence: { overall: 1 } } },
    { id: "nicomedia", identity: { name: "Nicomedia" }, position: { lon: 29.92, lat: 40.77 }, historical: { confidence: { overall: 1 } } },
  ]);
  const result = build1326CandidateEvidencePilot({
    t3Result: t3,
    adjacencyGraph: graph,
    radiusKm: 100,
    referenceTerrainProvider: () => [{ slopeDegrees: 25, ridgeAffinity: 0.8, mountainResistance: 0.7 }],
    edgeTerrainProvider: () => [{ slopeDegrees: 10, ridgeAffinity: 0.1, mountainResistance: 0.1 }],
  });
  assert.equal(result.scenarioDate, "1326-04-07");
  assert.equal(result.authoritative, false);
  assert.equal(result.status, "candidate-review-package");
  assert.ok(result.layers.t3D.edgeAssociations.every((edge) => edge.candidateOnly));
  assert.ok(result.layers.p61EdgeEvidence.every((edge) => edge.candidateOnly));
});
