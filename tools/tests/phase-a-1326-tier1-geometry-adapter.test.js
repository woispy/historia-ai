import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const SCENARIO_DATE = "1326-04-07";
const registry = JSON.parse(await fs.readFile(path.resolve("data/gis/1326/tier1-geometry-adapter-registry.json"), "utf8"));

assert.equal(registry.schemaVersion, 1);
assert.equal(registry.scenarioDate, SCENARIO_DATE);
assert.equal(registry.authorityStatus, "reviewed-evidence-staging");
assert.equal(registry.promotion, "BLOCKED");
assert.deepEqual(registry.records.map((r) => r.entityId), ["ottoman-beylik", "esrefogullari", "alaye"]);

for (const record of registry.records) {
  assert.equal(record.temporalApplicability.scenarioDate, SCENARIO_DATE);
  assert.equal(record.geometry.generation, "forbidden");
  assert.notEqual(record.state, "canonical");
}

for (const id of ["esrefogullari", "alaye"]) {
  const record = registry.records.find((r) => r.entityId === id);
  assert.equal(record.state, "source-gap");
  assert.equal(record.geometry.status, "pending-source-acquisition");
}

console.log("1326 Tier-1 geometry adapter contract: PASS");
