import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-pilot-readiness-"));
const validator = path.join(root, "tools/historical-gis/cli/validate-1326-t3b-pilot-readiness.js");
const sha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const recordSha = "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const packetSha = crypto.createHash("sha256").update(JSON.stringify([candidate])).digest("hex");
const geometrySha = crypto.createHash("sha256").update(JSON.stringify(geometry)).digest("hex");
const geometry = { type: "Polygon", coordinates: [[[29,40],[29.1,40],[29.1,40.1],[29,40.1],[29,40]]] };
const candidate = { sourceFeatureIndex: 7, sourceFeatureId: "feature-7", geometry };
const reviewId = "cliopatria-1326-feature-7-" + recordSha.slice(0,16);

const reports = {
  candidates: { scenarioDate:"1326-04-07", source:{sourceId:"cliopatria-v0.2.0"}, candidates:[candidate], candidatePacketSha256:packetSha, promotion:"BLOCKED" },
  screening: { scenarioDate:"1326-04-07", source:{sourceId:"cliopatria-v0.2.0"}, candidates:[{...candidate,sourceGeometrySha256:geometrySha}], candidatePacketSha:packetSha, promotion:"BLOCKED" },
  reconciliation: { scenarioDate:"1326-04-07", sourceId:"cliopatria-v0.2.0", candidatePacketSha256:packetSha, results:[{candidates:[{sourceFeatureIndex:7,sourceFeatureId:"feature-7"}]}], promotion:"BLOCKED" },
  review: { scenarioDate:"1326-04-07", source:{sourceId:"cliopatria-v0.2.0"}, candidatePacketSha256:sha, reviewQueue:[{sourceFeatureIndex:7,sourceFeatureId:"feature-7",reviewId,reviewedGeometry:null,reviewStatus:"pending",promotion:"BLOCKED",sourceEvidence:{candidateRecordSha256:recordSha}}], promotion:"BLOCKED" },
  ledger: {schemaVersion:2,authorityStatus:"review-ledger-only",promotion:"BLOCKED",records:[{sourceFeatureIndex:7,reviewId,provenance:{candidatePacketSha256:sha,candidateRecordSha256:recordSha},decision:{status:"pending"}}]},
  evidence: {schemaVersion:1,authorityStatus:"evidence-reference-only",promotion:"BLOCKED",policy:{geometryGeneration:false,controllerInference:false,canonicalPromotion:false},edges:[{edgeId:"e1"}]},
  bindings: {schemaVersion:1,authorityStatus:"bridge-reference-only",promotion:"BLOCKED",policy:{automaticReviewMatching:false,geometryGeneration:false,controllerInference:false,canonicalPromotion:false},reviewBindings:[]}
};

async function writeSet(name, set) {
  const dir=path.join(temp,name); await fs.mkdir(dir);
  const paths={};
  for(const [k,v] of Object.entries(set)){paths[k]=path.join(dir,k+".json");await fs.writeFile(paths[k],JSON.stringify(v));}
  return paths;
}
let caseNo = 0;
async function run(set, ok) {
  const p=await writeSet(`case-${++caseNo}`,set);
  const args=["--candidates",p.candidates,"--screening",p.screening,"--reconciliation",p.reconciliation,"--review",p.review,"--ledger",p.ledger,"--bindings",p.bindings,"--evidence",p.evidence];
  const result=await new Promise(resolve=>{const child=spawn(process.execPath,[validator,...args],{cwd:root,stdio:["ignore","pipe","pipe"]});let err="";child.stderr.on("data",d=>err+=d);child.on("close",code=>resolve({code,err}));});
  assert.equal(result.code===0,ok,result.err);
}
await run(reports,true);
await run({...reports,bindings:{...reports.bindings,reviewBindings:[{reviewId:"review-bithynia-pilot-001",edgeEvidenceIds:["e1"]}]}},false);
await run({...reports,ledger:{...reports.ledger,records:[{...reports.ledger.records[0],provenance:{...reports.ledger.records[0].provenance,candidatePacketSha256:"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"}}]}},false);
console.log("1326 T3-B pilot readiness gate contract passed.");
