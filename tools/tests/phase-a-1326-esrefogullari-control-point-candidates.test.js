import fs from "node:fs/promises"; import path from "node:path"; import assert from "node:assert/strict";
const p=path.resolve("data/gis/1326/esrefogullari-historical-control-point-candidates.json");
const d=JSON.parse(await fs.readFile(p,"utf8"));
assert.equal(d.authorityStatus,"constraint-evidence-only");
assert.equal(d.promotion,"BLOCKED");
assert.equal(d.anchors.length,3);
for(const a of d.anchors){
  assert.ok(Array.isArray(a.geo) && a.geo.length===2);
  assert.equal(a.pixel,null);
  assert.equal(a.politicalExtentConfidence,"none");
  assert.ok(a.geometryRole.endsWith("candidate-only"));
}
assert.ok(d.geographicCoordinateSource.temporalWarning.includes("1300"));
assert.ok(d.locks.some(x=>x.includes("Null pixel")));
assert.ok(d.locks.some(x=>x.includes("canonical MapBin")));
console.log("Eşrefoğulları historical control-point candidates: PASS — independent geo anchors staged without pixel or boundary authority.");
