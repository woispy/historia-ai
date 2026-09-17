/**
 * Historia AI — Candidate Source Evaluation contract test.
 *
 * Verifies the P3 candidate-source pipeline (network-free, local fixtures):
 *  - Bbox filtering: Anatolia candidates are found, out-of-bbox features are
 *    excluded.
 *  - Granularity evidence: vertex counts, average density, named candidates.
 *  - Fail-closed verdict: usableAsProvinceBoundary is ALWAYS false from the
 *    tool alone, even for high-granularity sources.
 *  - Provenance update registers the candidate WITHOUT touching
 *    requiredSource status, promotion gates, or other candidates.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { evaluateCandidateSource, updateProvenanceCandidate, candidateEvaluationBbox } from "../historical-gis/province/CandidateSourceEvaluator.js";

let passed = 0;

const goldenDirectory = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "tests", "fixtures", "political-geography", "anatolia-1300");
const goldenProvenance = JSON.parse(await readFile(path.join(goldenDirectory, "provenance.json"), "utf8"));

// Synthetic test-only GeoJSON: a coarse polity polygon (low vertex density)
// plus a province-granularity polygon (high vertex density), both in bbox,
// plus an out-of-bbox feature that must be excluded.
function circlePolygon(cx, cy, r, points) {
  const ring = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    ring.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  ring.push(ring[0]);
  return { type: "Polygon", coordinates: [ring] };
}

const testGeojson = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Coarse Polity" }, geometry: circlePolygon(33, 39, 3, 12) },
    { type: "Feature", properties: { name: "Fine Province" }, geometry: circlePolygon(30, 38, 0.5, 400) },
    { type: "Feature", properties: { name: "Out Of Bbox" }, geometry: circlePolygon(10, 10, 1, 8) },
    { type: "Feature", properties: {}, geometry: circlePolygon(35, 40, 0.2, 20) },
  ],
};

// 1. Bbox filtering + granularity evidence
const evaluation = evaluateCandidateSource({ geojson: testGeojson });
assert.equal(evaluation.featureCount, 4);
assert.equal(evaluation.anatoliaCandidateCount, 3, "out-of-bbox feature must be excluded");
assert.equal(evaluation.hints.totalVerticesInBbox, 13 + 401 + 21, "circle fixtures store points+1 (closing vertex)");
assert.equal(evaluation.hints.averageVerticesPerCandidate, Math.round(435 / 3));
assert.equal(evaluation.hints.namedCandidateCount, 2, "unnamed candidate must be counted but not named");
assert.deepEqual(evaluation.hints.geometryTypes, ["Polygon"]);
passed += 1;

// 2. Fail-closed verdict: even high-granularity sources are never approved
//    by the tool alone.
const fineOnly = evaluateCandidateSource({ geojson: { type: "FeatureCollection", features: [
  { type: "Feature", properties: { name: "Very Fine" }, geometry: circlePolygon(33, 39, 2, 5000) },
] } });
assert.equal(fineOnly.anatoliaCandidateCount, 1);
assert.equal(fineOnly.verdict.usableAsProvinceBoundary, false, "fail-closed: tool alone never approves a source");
assert.ok(fineOnly.verdict.reason.includes("fail-closed"));
passed += 1;

// 3. Provenance update registers the candidate, touches nothing else
const updated = updateProvenanceCandidate({
  provenance: goldenProvenance,
  sourceId: "test-candidate-source",
  url: "https://example.com/test.geojson",
  licenseReview: "pending",
  evaluation,
});
assert.equal(updated.sourceCandidates.length, goldenProvenance.sourceCandidates.length + 1);
const registered = updated.sourceCandidates.find((item) => item.sourceId === "test-candidate-source");
assert.ok(registered);
assert.equal(registered.usableAsProvinceBoundary, false, "registered candidate stays fail-closed");
assert.equal(registered.anatoliaCandidateCount, 3);
assert.equal(registered.licenseReview, "pending");
assert.deepEqual(updated.requiredSource, goldenProvenance.requiredSource, "requiredSource must be untouched");
assert.equal(updated.policy, goldenProvenance.policy, "policy must be untouched");
assert.equal(updated.status, goldenProvenance.status, "status must be untouched");
for (const original of goldenProvenance.sourceCandidates) {
  const preserved = updated.sourceCandidates.find((item) => item.sourceId === original.sourceId);
  assert.ok(preserved, `existing candidate ${original.sourceId} must be preserved`);
}
passed += 1;

// 4. Re-registering the same sourceId replaces the candidate (no duplicates)
const reregistered = updateProvenanceCandidate({ provenance: updated, sourceId: "test-candidate-source", url: null, licenseReview: "reviewed", evaluation });
assert.equal(reregistered.sourceCandidates.length, updated.sourceCandidates.length, "re-registration must replace, not duplicate");
assert.equal(reregistered.sourceCandidates.find((item) => item.sourceId === "test-candidate-source").licenseReview, "reviewed");
passed += 1;

// 5. Malformed source is rejected
assert.throws(
  () => evaluateCandidateSource({ geojson: { type: "Feature", features: [] } }),
  /must be a GeoJSON FeatureCollection/,
);
assert.throws(
  () => updateProvenanceCandidate({ provenance: { sourceCandidates: "not-an-array" }, sourceId: "x" }),
  /sourceCandidates must be an array/,
);
passed += 1;

// 6. Exported bbox matches the Anatolia envelope
assert.deepEqual(candidateEvaluationBbox, [25.45, 35.72, 44.85, 42.35]);
passed += 1;

console.log(`Candidate source evaluation contract passed: ${passed} checks — bbox filtering, granularity evidence, fail-closed verdict, provenance registration untouched-gates.`);
