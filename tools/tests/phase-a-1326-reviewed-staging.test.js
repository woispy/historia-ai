import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const script = await fs.readFile(path.join(root, "tools/historical-gis/cli/build-1326-reviewed-staging.js"), "utf8");
assert.match(script, /reviewed-evidence-staging/);
assert.match(script, /canonicalMapbinMutation: false/);
assert.match(script, /syntheticGeometry: false/);

const matrix = JSON.parse(await fs.readFile(path.join(root, "data/gis/1326/evidence-matrix.json"), "utf8"));
assert.equal(matrix.scenarioDate, "1326-04-07");
assert.equal(matrix.authorityStatus, "evidence-only");

const output = path.join(root, "data/build/gis/1326/reviewed-staging/manifest.json");
try {
  const manifest = JSON.parse(await fs.readFile(output, "utf8"));
  assert.equal(manifest.scenarioDate, "1326-04-07");
  assert.equal(manifest.authorityStatus, "reviewed-evidence-staging");
  assert.equal(manifest.promotion, "BLOCKED");
  assert.equal(manifest.canonicalMapbinMutation, false);
  assert.equal(manifest.syntheticGeometry, false);
  assert.ok(manifest.entities.some(x => x.entityId === "esrefogullari" && x.geometry.geometryStatus === "pending-source-acquisition"));
  assert.ok(manifest.entities.some(x => x.entityId === "alaye" && x.geometry.geometryStatus === "pending-source-acquisition"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log("1326 reviewed evidence staging contract: PASS");
