import fs from "node:fs/promises"; import path from "node:path"; import assert from "node:assert/strict";
const d=JSON.parse(await fs.readFile(path.resolve("data/gis/1326/tier1-historical-anchor-candidates.json"),"utf8"));
assert.equal(d.scenarioDate,"1326-04-07"); assert.equal(d.authorityStatus,"constraint-evidence-only");
for(const e of Object.values(d.entities)){for(const a of e.anchors){assert.ok(a.locationConfidence);assert.ok(a.politicalExtentConfidence);assert.notEqual(a.geometryRole,"polygon-vertex");}}
console.log("1326 historical anchor registry: PASS — anchors remain constraints, not geometry.");
