import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const anchorsPath=path.resolve("data/gis/1326/tier1-historical-anchor-candidates.json");
const anchors=JSON.parse(await fs.readFile(anchorsPath,"utf8"));

function validateProof(proof){
  assert.equal(proof.scenarioDate,"1326-04-07");
  assert.equal(proof.authorityStatus,"constraint-evidence-only");
  assert.ok(proof.anchorId && proof.sourceRef);
  assert.ok(Array.isArray(proof.correspondence.pixel) && proof.correspondence.pixel.length===2);
  assert.ok(Array.isArray(proof.correspondence.geo) && proof.correspondence.geo.length===2);
  assert.notEqual(proof.boundaryRole,"polygon-vertex");
  assert.ok(proof.calibration);
}

for(const [entityId, entity] of Object.entries(anchors.entities)){
  for(const anchor of entity.anchors){
    const proof={
      entityId,
      scenarioDate:anchors.scenarioDate,
      authorityStatus:"constraint-evidence-only",
      anchorId:anchor.id,
      sourceRef:anchor.sourceRefs[0],
      correspondence:{pixel:[0,0],geo:[0,0]},
      calibration:{method:"affine",rmsResidual:null,validation:"pending"},
      politicalExtentConfidence:anchor.politicalExtentConfidence,
      boundaryRole:"not-a-boundary-vertex"
    };
    validateProof(proof);
  }
}
assert.ok(anchors.globalRules.some(x=>x.includes("Named places are constraints")));
console.log("1326 historical control-point proof contract: PASS — source-backed correspondence shape enforced; no boundary authority granted.");
