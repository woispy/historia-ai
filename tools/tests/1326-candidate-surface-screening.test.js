import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = path.join(root, "tools/tests/fixtures/1326-candidate-surface");
const script = path.join(root, "tools/historical-gis/cli/screen-1326-political-candidate-surface.js");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-t3b-"));
const output = path.join(temp, "screening.json");
const candidateReport = JSON.parse(await fs.readFile(path.join(fixture, "candidates.json"), "utf8"));
candidateReport.source.extractedGeojsonSha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
candidateReport.source.inputSha256 = candidateReport.source.extractedGeojsonSha256;
candidateReport.candidates = candidateReport.candidates.map(candidate => ({ ...candidate, reconciliationStatus: "pending" }));
candidateReport.candidatePacketSha256 = crypto.createHash("sha256").update(JSON.stringify(candidateReport.candidates)).digest("hex");
const candidateInput = path.join(temp, "candidates.json");
await fs.writeFile(candidateInput, JSON.stringify(candidateReport));

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [
    script,
    "--input", candidateInput,
    "--anchors", path.join(fixture, "anchors.json"),
    "--output", output,
    "--radius-km", "120",
  ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => code === 0
    ? resolve()
    : reject(new Error(stderr || `screening exited ${code}`)));
});

const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.scenarioDate, "1326-04-07");
assert.equal(report.screening.notGeometryAuthority, true);
assert.equal(report.screening.noSyntheticGeometry, true);
assert.equal(report.counts.inputCandidates, 2);
assert.equal(report.counts.screenedCandidates, 1);
assert.equal(report.counts.rejectedCandidates, 1);
assert.equal(report.candidates[0].sourceFeatureId, "near-bursa");
assert.equal(report.candidates[0].anchorHits[0].anchorId, "bursa-core");
assert.equal(report.candidates[0].promotion, "BLOCKED");
assert.deepEqual(report.candidates[0].geometry, JSON.parse(await fs.readFile(path.join(fixture, "candidates.json"), "utf8")).candidates[0].geometry);

console.log("1326 candidate surface screening contract passed.");
