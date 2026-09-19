import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const p = path.resolve("data/gis/1326/tier1-reviewed-reconstruction-dossier.json");
const d = JSON.parse(await fs.readFile(p, "utf8"));
assert.equal(d.schemaVersion, 1);
assert.equal(d.scenarioDate, "1326-04-07");
assert.equal(d.authorityStatus, "reviewed-reconstruction");
assert.equal(d.promotion, "BLOCKED");
for (const id of ["esrefogullari", "alaye"]) {
  assert.equal(d.entities[id].geometryStatus, "pending-source-acquisition");
  assert.deepEqual(d.entities[id].sourceArtifacts, []);
  assert.deepEqual(d.entities[id].controlPoints, []);
  assert.deepEqual(d.entities[id].ring, []);
}
console.log("1326 reviewed reconstruction dossier: PASS — no geometry fabricated.");
