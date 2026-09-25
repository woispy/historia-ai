import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-reconciliation-integrity-"));
const script = path.join(root, "tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js");
const sha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const candidate = {
  sourceFeatureIndex: 7, sourceFeatureId: "feature-7", name: "Ottoman",
  fromYear: 1200, toYear: 1400, type: "POLITY",
  wikidataId: null, seshatId: null,
  geometry: { type: "Polygon", coordinates: [[[29,40],[29.1,40],[29.1,40.1],[29,40.1],[29,40]]] },
  reconciliationStatus: "pending", geometryAuthorityStatus: "candidate-evidence-only"
};
const matrix = JSON.parse(await fs.readFile(path.join(root, "data/gis/1326/evidence-matrix.json"), "utf8"));
const report = {
  schemaVersion: 1, scenarioDate: "1326-04-07",
  source: { sourceId: "cliopatria-v0.2.0", sourceTag: "v0.2.0",
    immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
    extractedGeojsonSha256: sha, inputSha256: sha },
  temporalRule: "FromYear <= 1326 <= ToYear", counts: { inputFeatures: 1, candidates: 1, excluded: { outsideTemporalRange: 0, nonPolity: 0, missingGeometry: 0 } },
  candidates: [candidate],
  candidatePacketSha256: crypto.createHash("sha256").update(JSON.stringify([candidate])).digest("hex")
};
const input = path.join(temp, "candidate.json");
await fs.writeFile(input, JSON.stringify(report));
async function run(packet, expected) {
  await fs.writeFile(input, JSON.stringify(packet));
  const out = path.join(temp, crypto.randomUUID() + ".json");
  const result = await new Promise(resolve => {
    const child = spawn(process.execPath, [script, "--input", input, "--output", out], { cwd: root, stdio: ["ignore","pipe","pipe"] });
    let stderr = ""; child.stderr.on("data", d => stderr += d); child.on("close", code => resolve({code,stderr}));
  });
  assert.equal(result.code === 0, expected, result.stderr);
}
await run(report, true);
await run({ ...report, candidatePacketSha256: sha }, false);
const inputDrift = { ...report, source: { ...report.source, inputSha256: "f".repeat(64) } };
await run(inputDrift, false);
const duplicate = { ...report, candidates: [candidate, { ...candidate, sourceFeatureIndex: 7, sourceFeatureId: "feature-7b" }] };
await run({ ...duplicate, candidatePacketSha256: crypto.createHash("sha256").update(JSON.stringify(duplicate.candidates)).digest("hex") }, false);
assert.equal(matrix.scenarioDate, "1326-04-07");
console.log("1326 candidate reconciliation integrity contract passed.");
