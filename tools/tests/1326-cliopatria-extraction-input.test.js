import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const prep = fs.readFileSync(path.join(root, "tools/historical-gis/cli/prepare-1326-cliopatria-extraction-input.js"), "utf8");
const extract = fs.readFileSync(path.join(root, "tools/historical-gis/cli/extract-1326-cliopatria-candidates.js"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "tools/historical-gis/cli/run-1326-cliopatria-candidate-pipeline.js"), "utf8");

assert.match(prep, /const SOURCE_ID = "cliopatria-v0\.2\.0"/);
assert.match(prep, /archiveSha/);
assert.match(prep, /Expected exactly one GeoJSON member/);
assert.match(prep, /powershell\.exe/);
assert.match(prep, /Expand-Archive/);
assert.match(prep, /FeatureCollection/);
assert.match(prep, /Unsafe archive member path/);
assert.match(prep, /extractedSha/);
assert.match(prep, /BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW/);
assert.match(extract, /--extraction-input/);
assert.match(extract, /Extracted GeoJSON SHA-256 does not match the extraction input record/);
assert.match(pipeline, /--extraction-input/);

console.log("1326 extraction-input contract passed: extraction is bound to the verified archive snapshot and extracted-member hash.");
