import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = path.join(root, "tools/historical-gis/cli/validate-1326-acquisition-manifest.js");
const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });

assert.equal(result.status, 0, result.stderr || result.stdout);
const output = JSON.parse(result.stdout);
assert.equal(output.scenarioDate, "1326-04-07");
assert.equal(output.authorityStatus, "evidence-only");
assert.equal(output.canonicalGeometryStatus, "not-promoted");
assert.equal(output.intakeGate, "PASS");
assert.equal(output.promotion, "BLOCKED_UNTIL_SOURCE_SNAPSHOTS_AND_RECONCILIATION");
