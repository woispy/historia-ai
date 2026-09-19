import fs from "node:fs";
import assert from "node:assert/strict";
const matrix = JSON.parse(fs.readFileSync("data/gis/1326/tier1-source-geometry-admissibility-matrix.json","utf8"));
assert.equal(matrix.schemaVersion,1); assert.equal(matrix.scenarioDate,"1326-04-07"); assert.equal(matrix.authorityStatus,"evidence-only");
assert.ok(matrix.records.length >= 10);
const allowed=new Set(["boundary-evidence-candidate","control-point-candidate","temporal-extent-constraint","context-only","prohibited-for-geometry"]);
for(const r of matrix.records){ assert.ok(r.entityId&&r.source); assert.ok(r.admissibility.length); for(const a of r.admissibility) assert.ok(allowed.has(a)); assert.ok(r.geometryUse&&r.controlPointUse&&r.temporalUse); assert.ok(r.requiredProvenance.length); assert.ok(r.forbiddenInterpretations.length); assert.notEqual(r.status,"canonical"); }
assert.ok(matrix.records.some(r=>r.source.includes("Wikimedia Commons")&&r.forbiddenInterpretations.includes("1326 relabel")));
assert.ok(matrix.globalExclusions.includes("Named places cannot become automatic polygon vertices."));
assert.ok(matrix.globalExclusions.includes("No record authorizes canonical MapBin mutation."));
assert.ok(matrix.globalExclusions.includes("SAFE TO DELETE remains 0."));
console.log("Phase A 1326 source-to-geometry admissibility matrix: PASS");