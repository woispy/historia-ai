import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-t3b-lineage-"));
const validator = path.join(root, "tools/historical-gis/cli/validate-1326-t3b-provenance-lineage.js");
const sha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const geometry = { type: "Polygon", coordinates: [[[29,40],[29.1,40],[29.1,40.1],[29,40.1],[29,40]]] };
const candidate = { sourceFeatureIndex: 7, sourceFeatureId: "feature-7", name: "Candidate", fromYear: 1200, toYear: 1400, type: "POLITY", wikidataId: null, seshatId: null, geometry, reconciliationStatus: "pending", geometryAuthorityStatus: "candidate-evidence-only" };
const packet = [candidate];
const packetSha = crypto.createHash("sha256").update(JSON.stringify(packet)).digest("hex");
const geometrySha = crypto.createHash("sha256").update(JSON.stringify(geometry)).digest("hex");
const record = { ...candidate, geometryBbox: [29,40,29.1,40.1], geometryBboxCenter: [29.05,40.05], anchorHits: [{ anchorId: "bursa-core", role: "anchor" }], sourceGeometrySha256: geometrySha, screeningOnly: true, promotion: "BLOCKED" };
const recordSha = crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
const base = {
  candidates: { scenarioDate: "1326-04-07", source: { sourceId: "cliopatria-v0.2.0", extractedGeojsonSha256: sha }, candidates: packet, candidatePacketSha256: packetSha },
  screening: { scenarioDate: "1326-04-07", source: { sourceId: "cliopatria-v0.2.0", extractedGeojsonSha256: sha }, candidatePacketSha256: packetSha, candidates: [record], promotion: "BLOCKED" },
  reconciliation: { scenarioDate: "1326-04-07", sourceId: "cliopatria-v0.2.0", candidatePacketSha256: packetSha, sourceProvenance: { extractedGeojsonSha256: sha }, results: [{ entityId: "candidate", candidates: [{ sourceFeatureIndex: 7, sourceFeatureId: "feature-7" }] }], promotion: "BLOCKED" },
  review: { scenarioDate: "1326-04-07", source: { sourceId: "cliopatria-v0.2.0" }, candidatePacketSha256: packetSha, sourceProvenance: { extractedGeojsonSha256: sha }, reviewQueue: [{ sourceFeatureIndex: 7, sourceFeatureId: "feature-7", reviewId: "cliopatria-1326-feature-7-"+recordSha.slice(0,16), sourceGeometry: { geometry, sha256: geometrySha, screeningSourceGeometrySha256: geometrySha }, sourceEvidence: { candidateRecordSha256: recordSha } }], promotion: "BLOCKED" }
};
async function run(name, payload, ok) {
  const dir = path.join(temp, name); await fs.mkdir(dir);
  const args = ["--candidates", path.join(dir,"c.json"), "--screening", path.join(dir,"s.json"), "--reconciliation", path.join(dir,"r.json"), "--review", path.join(dir,"v.json")];
  await fs.writeFile(args[1], JSON.stringify(payload.candidates)); await fs.writeFile(args[3], JSON.stringify(payload.screening)); await fs.writeFile(args[5], JSON.stringify(payload.reconciliation)); await fs.writeFile(args[7], JSON.stringify(payload.review));
  const result = await new Promise(resolve => { const child=spawn(process.execPath,[validator,...args],{cwd:root,stdio:["ignore","pipe","pipe"]}); let err=""; child.stderr.on("data",d=>err+=d); child.on("close",code=>resolve({code,err})); });
  assert.equal(result.code===0,ok,result.err);
}
await run("baseline", base, true);
await run("packet-drift", { ...base, screening: { ...base.screening, candidatePacketSha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" } }, false);
await run("geometry-drift", { ...base, review: { ...base.review, reviewQueue: [{ ...base.review.reviewQueue[0], sourceGeometry: { ...base.review.reviewQueue[0].sourceGeometry, screeningSourceGeometrySha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" } }] } }, false);
await run("identity-drift", { ...base, reconciliation: { ...base.reconciliation, results: [{ entityId: "candidate", candidates: [{ sourceFeatureIndex: 7, sourceFeatureId: "wrong" }] }] } }, false);
console.log("1326 T3-B end-to-end provenance lineage contract passed.");
