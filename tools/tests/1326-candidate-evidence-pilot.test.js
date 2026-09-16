import test from "node:test";
import assert from "node:assert/strict";
import { buildAdaptiveReferencePointGraph } from "../historical-gis/T3AdaptiveReferencePointEngine.js";
import { buildProvinceAdjacencyGraph } from "../historical-gis/province/ProvinceAdjacencyGraph.js";
import { build1326CandidateEvidencePilot } from "../historical-gis/province/1326CandidateEvidencePilot.js";

test("1326 candidate evidence pilot combines T3 and P6.1 without authority promotion", () => {
  const t3 = buildAdaptiveReferencePointGraph({
    source: { id: "pilot-1326", detailLevel: "medium" },
    features: [{
      id: "sangarius",
      class: "RIVER",
      geometry: [[29.0, 40.0], [29.5, 40.1], [30.0, 40.3], [30.5, 40.4]],
    }, {
      id: "bithynian-ridge",
      class: "RIDGE",
      geometry: [[29.2, 40.2], [29.5, 40.35], [29.8, 40.5]],
    }],
  });
  const graph = buildProvinceAdjacencyGraph([
    { id: "bursa", identity: { name: "Bursa" }, position: { lon: 29.06, lat: 40.19 }, historical: { confidence: { overall: 1 } } },
    { id: "nicaea", identity: { name: "Nicaea" }, position: { lon: 29.72, lat: 40.43 }, historical: { confidence: { overall: 1 } } },
    { id: "nicomedia", identity: { name: "Nicomedia" }, position: { lon: 29.92, lat: 40.77 }, historical: { confidence: { overall: 1 } } },
  ]);
  const pilot = build1326CandidateEvidencePilot({
    t3Result: t3,
    adjacencyGraph: graph,
    radiusKm: 100,
    referenceTerrainProvider: () => [
      { slopeDegrees: 22, ridgeAffinity: 0.7, mountainResistance: 0.65 },
      { slopeDegrees: 30, ridgeAffinity: 0.85, mountainResistance: 0.8 },
    ],
    edgeTerrainProvider: (edge) => edge.source === "bursa"
      ? [{ slopeDegrees: 8, ridgeAffinity: 0.1, mountainResistance: 0.1 }]
      : [{ slopeDegrees: 35, ridgeAffinity: 0.9, mountainResistance: 0.9 }],
  });

  assert.equal(pilot.phase, "1326-CANDIDATE-EVIDENCE-PILOT");
  assert.equal(pilot.scenarioDate, "1326-04-07");
  assert.equal(pilot.authoritative, false);
  assert.equal(pilot.status, "candidate-review-package");
  assert.ok(pilot.diagnostics.candidateEdgeCount > 0);
  assert.ok(pilot.layers.t3D.edgeAssociations.every((edge) => edge.candidateOnly === true));
  assert.ok(pilot.layers.p61EdgeEvidence.every((edge) => edge.candidateOnly === true));
});

test("1326 candidate evidence pilot refuses a different scenario date", () => {
  assert.throws(() => build1326CandidateEvidencePilot({ scenarioDate: "1300-01-01" }), /1326-04-07/);
});
