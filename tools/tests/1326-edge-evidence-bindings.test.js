import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const dir = path.join(root, "data/build/gis/1326");
const ledger = path.join(dir, "test-explicit-binding-ledger.json");
const mapping = path.join(dir, "test-explicit-binding-input.json");
const output = path.join(dir, "test-explicit-binding-output.json");

await fs.mkdir(dir, { recursive: true });
await fs.writeFile(ledger, JSON.stringify({
  schemaVersion: 2,
  kind: "historical-1326-geometry-review-ledger",
  scenarioDate: "1326-04-07",
  authorityStatus: "review-ledger-only",
  promotion: "BLOCKED",
  records: [{
    reviewId: "cliopatria-1326-feature-7-0123456789abcdef",
    sourceFeatureIndex: 7,
    provenance: { candidatePacketSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", candidateRecordSha256: "0123456789abcdef" + "0123456789abcdef0123456789abcdef0123456789abcdef" }
  }]
}, null, 2));
await fs.writeFile(mapping, JSON.stringify({
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  authorityStatus: "explicit-binding-input",
  promotion: "BLOCKED",
  policy: {
    automaticReviewMatching: false,
    geometryGeneration: false,
    controllerInference: false,
    canonicalPromotion: false
  },
  reviewBindings: [{
    reviewId: "cliopatria-1326-feature-7-0123456789abcdef",
    edgeEvidenceIds: ["bursa-nicaea-frontier-1326", "nicaea-sangarius-corridor-1326"]
  }]
}, null, 2));

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}

async function expectFailure(script, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    child.on("error", reject);
    child.on("exit", code => {
      assert.notEqual(code, 0);
      resolve();
    });
  });
}
await run("tools/historical-gis/cli/prepare-1326-edge-evidence-bindings.js", ["--ledger", ledger, "--mapping", mapping, "--output", output]);
await run("tools/historical-gis/cli/validate-1326-edge-evidence-bindings.js", ["--input", output]);
const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.authorityStatus, "bridge-reference-only");
assert.equal(report.promotion, "BLOCKED");
assert.equal(report.policy.automaticReviewMatching, false);
assert.deepEqual(report.reviewBindings[0].edgeEvidenceIds, ["bursa-nicaea-frontier-1326", "nicaea-sangarius-corridor-1326"]);
const invalidMapping = path.join(dir, "test-explicit-binding-invalid.json");
await fs.writeFile(invalidMapping, JSON.stringify({
  schemaVersion: 1, scenarioDate: "1326-04-07", authorityStatus: "explicit-binding-input", promotion: "BLOCKED",
  policy: { automaticReviewMatching: false, geometryGeneration: false, controllerInference: false, canonicalPromotion: false },
  reviewBindings: [{ reviewId: "review-bithynia-pilot-001", edgeEvidenceIds: ["bursa-nicaea-frontier-1326"] }]
}, null, 2));
await expectFailure("tools/historical-gis/cli/prepare-1326-edge-evidence-bindings.js", ["--ledger", ledger, "--mapping", invalidMapping, "--output", output]);
console.log("1326 explicit edge-evidence binding contract passed: candidate-bound review identity and fail-closed negative case.");
