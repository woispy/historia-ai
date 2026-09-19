import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(root, "data/gis/1326/alaiye-source-observation.json");
const record = JSON.parse(fs.readFileSync(file, "utf8"));

assert.equal(record.schemaVersion, 1);
assert.equal(record.scenarioDate, "1326-04-07");
assert.equal(record.authorityStatus, "evidence-only");
assert.equal(record.promotion, "BLOCKED");
assert.equal(record.historicalEntity, "Alâiye Beyliği");
assert.ok(Array.isArray(record.sources) && record.sources.length >= 2);
assert.ok(record.sources.some((s) => s.sourceId === "tdv-alaiye-beyligi"));
assert.ok(record.sources.some((s) => s.sourceId === "phersu-alaiye"));
assert.equal(record.1326Interpretation.noBackwardProjection, true);
assert.equal(record.1326Interpretation.noPolygonGenerated, true);
assert.equal(record.geometryStatus, "pending-source-acquisition");
assert.ok(record.requiredNextEvidence.includes("physical-land validation"));
assert.ok(record.locks.some((x) => x.includes("No later-period maximum extent")));
console.log("Alâiye source observation contract: PASS");
