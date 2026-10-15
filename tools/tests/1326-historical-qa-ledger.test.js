import assert from "node:assert/strict";
import { build1326HistoricalQALedger } from "../historical-gis/province/1326HistoricalQALedger.js";

const reviewPackage = {
  schemaVersion: 1,
  phase: "1326-CANDIDATE-EVIDENCE-PILOT",
  scenarioDate: "1326-04-07",
  region: "Bursa-Nicaea-Nicomedia-Sangarius",
  authoritative: false,
  terrainSource: "P6.2-CopernicusDemCostSampler",
  layers: {
    p61EdgeEvidence: [
      {
        edgeId: "adj:bursa:nicaea",
        source: "bursa",
        target: "nicaea",
        candidateOnly: true,
        physicalSupport: 0.82,
        physicalPenalty: 0.18,
        evidenceSampleCount: 2,
        channelMeans: { slope: 0.1, ridge: 0.05, mountain: 0.02, river: 0, lake: 0, coast: 0 },
        disposition: "retain-candidate",
        t3ReferencePointCount: 2,
        t3ReferencePointIds: ["bithynia-core:0", "bithynia-core:1"],
        strongestReferenceImportance: 1,
        lockedReferenceCount: 1,
        constraintReferenceCount: 1,
        reviewFlags: ["constraint-reference-near-edge", "locked-reference-near-edge"],
      },
      {
        edgeId: "adj:nicaea:sangarius",
        source: "nicaea",
        target: "sangarius",
        candidateOnly: true,
        physicalSupport: 0.31,
        physicalPenalty: 0.69,
        evidenceSampleCount: 2,
        channelMeans: { slope: 0.4, ridge: 0.3, mountain: 0.5, river: 0, lake: 0, coast: 0 },
        disposition: "challenge-candidate",
        t3ReferencePointCount: 0,
        t3ReferencePointIds: [],
        strongestReferenceImportance: null,
        lockedReferenceCount: 0,
        constraintReferenceCount: 0,
        reviewFlags: ["physical-evidence-challenge"],
      },
    ],
    adjacencyReviewTelemetry: {
      reviews: [
        { edgeId: "adj:bursa:nicaea", disposition: "retain-candidate", reasons: ["locked-reference-near-edge", "t3-reference-support-present"] },
        { edgeId: "adj:nicaea:sangarius", disposition: "challenge-candidate", reasons: ["candidate-requires-review", "physical-support-below-threshold"] },
      ],
    },
  },
};

const ledger = build1326HistoricalQALedger(reviewPackage);

assert.equal(ledger.phase, "1326-HISTORICAL-QA-LEDGER");
assert.equal(ledger.scenarioDate, "1326-04-07");
assert.equal(ledger.authoritative, false);
assert.equal(ledger.candidateOnly, true);
assert.equal(ledger.counts.edgeCount, 2);
assert.equal(ledger.counts.retainCandidateCount, 1);
assert.equal(ledger.counts.challengeCandidateCount, 1);
assert.equal(ledger.records[0].historicalEvidence.lockedReferenceCount, 1);
assert.equal(ledger.records[0].physicalEvidence.physicalSupport, 0.82);
assert.equal(ledger.records[1].review.disposition, "challenge-candidate");
assert.deepEqual(ledger.provenance, {
  sourcePhase: "1326-CANDIDATE-EVIDENCE-PILOT",
  terrainSource: "P6.2-CopernicusDemCostSampler",
  sourceSchemaVersion: 1,
});

console.log("1326 historical QA ledger contract passed.");
