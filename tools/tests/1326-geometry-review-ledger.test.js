import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const input = path.join(root, "data/build/gis/1326/test-geometry-review-ledger-input.json");
const output = path.join(root, "data/build/gis/1326/test-geometry-review-ledger.json");

const packetSha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const recordSha = "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const queue = {
  kind: "historical-1326-political-geometry-reconciliation-queue",
  scenarioDate: "1326-04-07",
  source: { sourceId: "cliopatria-v0.2.0" },
  candidatePacketSha256: packetSha,
  authorityStatus: "candidate-review-only",
  promotion: "BLOCKED",
  reviewQueue: [{
    reviewId: "cliopatria-1326-feature-7-" + recordSha.slice(0, 16),
    sourceFeatureIndex: 7,
    entityReconciliation: {
      status: "single-match",
      matches: [{ entityId: "ottoman-beylik" }]
    },
    temporalApplicability: { passes: true },
    sourceEvidence: {
      candidatePacketSha256: packetSha,
      candidateRecordSha256: recordSha
    }
  }]
};

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(input, JSON.stringify(queue, null, 2));

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}

await run("tools/historical-gis/cli/prepare-1326-geometry-review-ledger.js", [
  "--input", input, "--output", output
]);

const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.schemaVersion, 2);
assert.equal(report.authorityStatus, "review-ledger-only");
assert.equal(report.promotion, "BLOCKED");
assert.equal(report.records.length, 1);
assert.deepEqual(report.records[0].edgeAssessments, []);
assert.deepEqual(report.records[0].confidence, {
  existence: 0,
  controller: 0,
  frontier: 0,
  exactBoundary: 0,
  geometry: 0
});

await run("tools/historical-gis/cli/validate-1326-geometry-review-ledger.js", [
  "--input", output, "--queue", input
]);

report.records[0].edgeAssessments = [{
  edgeId: "edge-bursa-nicaea-frontier-test",
  edgeType: "FRONTIER",
  status: "uncertain",
  confidence: 0.25,
  evidenceRefs: ["anchor-graph:bursa-nicaea"],
  notes: "Test evidence only; not a political boundary."
}];
await fs.writeFile(output, JSON.stringify(report, null, 2));
await run("tools/historical-gis/cli/validate-1326-geometry-review-ledger.js", [
  "--input", output
]);

const validated = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(validated.records[0].edgeAssessments[0].edgeType, "FRONTIER");
assert.equal(validated.records[0].edgeAssessments[0].confidence, 0.25);
const drifted = JSON.parse(JSON.stringify(report));
drifted.records[0].sourceFeatureIndex = 999;
await fs.writeFile(output, JSON.stringify(drifted, null, 2));
await assert.rejects(
  () => run("tools/historical-gis/cli/validate-1326-geometry-review-ledger.js", ["--input", output, "--queue", input]),
  /exit/
);

console.log("1326 geometry review ledger contract passed: v2 schema, queue binding, empty edge initialization, and edge validation are enforced.");
