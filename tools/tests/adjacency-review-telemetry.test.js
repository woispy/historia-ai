import assert from "node:assert/strict";
import { buildAdjacencyReviewTelemetry } from "../historical-gis/province/AdjacencyEvidenceScorer.js";

const telemetry = buildAdjacencyReviewTelemetry([
  {
    edgeId: "adj:bursa:nicaea",
    disposition: "retain-candidate",
    physicalSupport: 0.82,
    evidenceSampleCount: 2,
    t3ReferencePointCount: 2,
    lockedReferenceCount: 1,
    constraintReferenceCount: 1,
  },
  {
    edgeId: "adj:nicaea:sangarius",
    disposition: "challenge-candidate",
    physicalSupport: 0.31,
    evidenceSampleCount: 2,
    t3ReferencePointCount: 0,
    lockedReferenceCount: 0,
    constraintReferenceCount: 0,
  },
  {
    edgeId: "adj:nicomedia:interior",
    disposition: "unscored",
    physicalSupport: null,
    evidenceSampleCount: 0,
    t3ReferencePointCount: 0,
    lockedReferenceCount: 0,
    constraintReferenceCount: 0,
  },
]);

assert.equal(telemetry.authoritative, false);
assert.equal(telemetry.candidateOnly, true);
assert.equal(telemetry.edgeCount, 3);
assert.equal(telemetry.retainCandidateCount, 1);
assert.equal(telemetry.challengeCandidateCount, 1);
assert.equal(telemetry.unscoredCount, 1);
assert.deepEqual(telemetry.reviews[0].reasons, [
  "locked-reference-near-edge",
  "physical-support-above-threshold",
  "t3-reference-support-present",
  "terrain-evidence-present",
].sort());
assert.ok(telemetry.reviews[1].reasons.includes("candidate-requires-review"));
assert.ok(telemetry.reviews[2].reasons.includes("candidate-unscored"));

console.log("Adjacency review telemetry contract passed.");
