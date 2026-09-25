import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-review-integrity-"));
const validator = path.join(root, "tools/historical-gis/cli/validate-1326-geometry-reconciliation.js");
const geometry = { type: "Polygon", coordinates: [[[29,40],[29.1,40],[29.1,40.1],[29,40.1],[29,40]]] };
const candidate = { sourceFeatureIndex: 7, sourceFeatureId: "review-7", name: "Candidate", fromYear: 1200, toYear: 1400, type: "POLITY", geometryAuthorityStatus: "candidate-evidence-only", reconciliationStatus: "pending" };
const recordSha = crypto.createHash("sha256").update(JSON.stringify(candidate)).digest("hex");
const packetSha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const geometrySha = crypto.createHash("sha256").update(JSON.stringify(geometry)).digest("hex");

function makeReport(sourceGeometry = geometry, sourceGeometrySha = geometrySha) {
  return {
    kind: "historical-1326-political-geometry-reconciliation-queue", schemaVersion: 1,
    scenarioDate: "1326-04-07", source: { sourceId: "cliopatria-v0.2.0" },
    sourceProvenance: { extractedGeojsonSha256: packetSha }, candidatePacketSha256: packetSha,
    authorityStatus: "candidate-review-only", promotion: "BLOCKED",
    policy: { sourceGeometryIsAuthoritative: false, geometryMutationAllowed: false, syntheticGeometryAllowed: false, controlImpliesGeometry: false, reviewedGeometryRequiredBeforeCanonical: true },
    reviewQueue: [{
      reviewId: "cliopatria-1326-feature-7-" + recordSha.slice(0,16),
      sourceFeatureIndex: 7,
      sourceGeometry: { geometry: sourceGeometry, sha256: sourceGeometrySha, immutable: true, mutationPolicy: "immutable-source-evidence" },
      sourceEvidence: { candidatePacketSha256: packetSha, candidateRecordSha256: recordSha, reviewIdDerivation: "cliopatria-1326-feature-" + "$"+"{sourceFeatureIndex}" + "-" + "$"+"{candidatePacketSha256.slice(0,16)}" },
      reviewedGeometry: null, reviewStatus: "pending", promotion: "BLOCKED"
    }]
  };
}

async function runCase(name, report, success) {
  const input = path.join(temp, name + ".json");
  await fs.writeFile(input, JSON.stringify(report));
  const result = await new Promise(resolve => {
    const child = spawn(process.execPath, [validator, "--input", input], { cwd: root, stdio: ["ignore","pipe","pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stderr }));
  });
  assert.equal(result.code === 0, success, result.stderr);
}

await runCase("baseline", makeReport(), true);
const mutatedGeometry = { type: "Polygon", coordinates: [[[29,40],[29.2,40],[29.1,40.1],[29,40.1],[29,40]]] };
await runCase("geometry-mutated", makeReport(mutatedGeometry, geometrySha), false);
await runCase("geometry-hash-mutated", makeReport(geometry, "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), false);
const packetDrift = makeReport();
packetDrift.sourceEvidence = undefined;
packetDrift.reviewQueue[0].sourceEvidence.candidatePacketSha256 = recordSha;
await runCase("packet-provenance-drift", packetDrift, false);

console.log("1326 geometry reconciliation integrity contract passed.");
