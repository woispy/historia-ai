import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const p=path.resolve("data/gis/1326/tier1-cartographic-artifact-ledger.json");
const d=JSON.parse(await fs.readFile(p,"utf8"));
assert.equal(d.schemaVersion,1);
assert.equal(d.scenarioDate,"1326-04-07");
assert.equal(d.authorityStatus,"reference-only");
assert.ok(Array.isArray(d.records) && d.records.length >= 2);
for(const r of d.records){
  assert.equal(r.geometryUse.includes("blocked"),true);
  assert.equal(r.sha256,null);
}
assert.ok(d.promotionLocks.includes("No synthetic geometry"));
assert.ok(d.promotionLocks.includes("No 1300-to-1326 relabeling"));
console.log("1326 cartographic artifact ledger: PASS — reference evidence remains non-canonical.");
