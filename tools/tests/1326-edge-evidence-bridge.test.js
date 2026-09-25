import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const dir = path.join(root, "data/build/gis/1326");
const ledger = path.join(dir, "test-edge-bridge-ledger.json");
const evidence = path.join(root, "data/gis/1326/pilot-edge-evidence/bithynia-core-01.json");
const bindings = path.join(dir, "test-edge-bridge-bindings.json");
const output = path.join(dir, "test-edge-bridge-output.json");

await fs.mkdir(dir, { recursive: true });
await fs.writeFile(ledger, JSON.stringify({
  schemaVersion: 2,
  kind: "historical-1326-geometry-review-ledger",
  scenarioDate: "1326-04-07",
  authorityStatus: "review-ledger-only",
  promotion: "BLOCKED",
  records: [{
    reviewId: "review-bithynia-pilot-001",
    sourceFeatureIndex: 7,
    entityIdentity: { status: "single-match", entityIds: ["ottoman-beylik"] },
    temporalEvidence: { scenarioDate: "1326-04-07", applicability: "supported", sourceRefs: ["test"] },
    boundaryEvidence: { status: "uncertain", sourceRefs: ["test"] },
    edgeAssessments: [],
    physicalConstraints: { status: "uncertain", sourceRefs: [] },
    topologyGate: { status: "not-run", checks: [] },
    provenance: { sourceId: "cliopatria-v0.2.0", candidatePacketSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" },
    confidence: { existence: 0, controller: 0, frontier: 0, exactBoundary: 0, geometry: 0 },
    decision: { status: "pending", reviewedGeometry: null }
  }]
}, null, 2));
await fs.writeFile(bindings, JSON.stringify({
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  authorityStatus: "bridge-reference-only",
  promotion: "BLOCKED",
  policy: {
    automaticReviewMatching: false,
    geometryGeneration: false,
    controllerInference: false,
    canonicalPromotion: false
  },
  reviewBindings: [{
    reviewId: "review-bithynia-pilot-001",
    edgeEvidenceIds: [
      "bursa-nicaea-frontier-1326",
      "nicaea-sangarius-corridor-1326",
      "nicaea-lefke-route-1326"
    ]
  }]
}, null, 2));

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}

await run("tools/historical-gis/cli/bridge-1326-edge-evidence.js", [
  "--ledger", ledger, "--evidence", evidence, "--bindings", bindings, "--output", output
]);

const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.authorityStatus, "review-ledger-only");
assert.equal(report.promotion, "BLOCKED");
assert.equal(report.bridge.geometryGeneration, false);
assert.equal(report.bridge.controllerInference, false);
assert.equal(report.bridge.canonicalPromotion, false);
assert.equal(report.bridge.boundReviewRecords, 1);
assert.equal(report.records[0].edgeAssessments.length, 3);
assert.equal(report.records[0].edgeAssessments[0].edgeId, "bursa-nicaea-frontier-1326");
assert.equal(report.records[0].edgeAssessments[0].status, "uncertain");
assert.equal(report.records[0].edgeAssessments[1].edgeType, "RIVER_CORRIDOR");
assert.equal(report.records[0].edgeAssessments[2].edgeType, "ROAD_CORRIDOR");
assert.equal(report.records[0].decision.reviewedGeometry, null);
assert.equal(report.records[0].decision.status, "pending");
assert.equal(report.bridge.mutationPolicy, "evidence-reference-copy-only");

await run("tools/historical-gis/cli/validate-1326-geometry-review-ledger.js", ["--input", output]);
console.log("1326 edge evidence bridge contract passed: explicit bindings only; authority and promotion remain blocked.");
