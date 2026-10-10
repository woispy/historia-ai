import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
const root = process.cwd();
const script = fs.readFileSync(path.join(root, "tools/historical-gis/cli/validate-1326-candidate-reconciliation.js"), "utf8");
const reconcile = fs.readFileSync(path.join(root, "tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js"), "utf8");
assert.match(script, /candidatePacketSha256/);
assert.match(script, /candidateRecordSha256/);
assert.match(script, /extractedGeojsonSha256/);
assert.match(script, /never-derived-from-name-match-alone/);
assert.match(reconcile, /candidateRecordSha256/);
assert.match(reconcile, /inputSha256/);
assert.match(reconcile, /"ottoman empire"/);
assert.match(reconcile, /"beylik of karasi"/);
assert.match(reconcile, /"beylik of saruhan"/);
assert.match(reconcile, /"beylik of aydin"/);
assert.match(reconcile, /replace\(\/ı\/g, "i"\)/);
const temp = await fsp.mkdtemp(path.join(os.tmpdir(), "historia-1326-entity-alias-"));
const sourceSha = "a".repeat(64);
const sourceCandidates = [
  "Ottoman Empire",
  "Byzantine Empire",
  "Ilkhanate",
  "Beylik of Karasi",
  "Beylik of Saruhan",
  "Beylik of Aydin"
].map((name, sourceFeatureIndex) => ({
  sourceFeatureIndex,
  sourceFeatureId: null,
  name,
  wikidataId: null,
  seshatId: null,
  fromYear: 1326,
  toYear: 1332,
  type: "POLITY",
  geometryAuthorityStatus: "candidate-evidence-only"
}));
const candidatePacketSha256 = crypto.createHash("sha256").update(JSON.stringify(sourceCandidates)).digest("hex");
const candidateInput = path.join(temp, "candidates.json");
const reconciliationOutput = path.join(temp, "reconciliation.json");
await fsp.writeFile(candidateInput, JSON.stringify({
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  source: {
    sourceId: "cliopatria-v0.2.0",
    sourceTag: "v0.2.0",
    immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
    extractedGeojsonSha256: sourceSha,
    inputSha256: sourceSha
  },
  candidates: sourceCandidates,
  candidatePacketSha256,
  promotion: "BLOCKED"
}));
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [
    "tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js",
    "--input", candidateInput,
    "--output", reconciliationOutput
  ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => code === 0 ? resolve() : reject(new Error(stderr || `reconciliation exited with code ${code}`)));
});
const report = JSON.parse(await fsp.readFile(reconciliationOutput, "utf8"));
assert.deepEqual(report.counts, { requiredEntities: 8, matched: 6, unmatched: 2, ambiguous: 0 });
assert.deepEqual(report.results.filter(item => item.status === "unmatched").map(item => item.entityId), ["esrefogullari", "alaye"]);
assert.equal(report.promotion, "BLOCKED");
assert.ok(report.results.every(item => item.autoPromotion === false));
await fsp.rm(temp, { recursive: true, force: true });
console.log("1326 candidate reconciliation alias behavior passed: six exact source labels match candidate-only; Eşrefoğulları and Alâiye remain unmatched; promotion BLOCKED.");
