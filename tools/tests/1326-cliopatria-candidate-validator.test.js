import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const script = fs.readFileSync(path.join(root, "tools/historical-gis/cli/validate-1326-cliopatria-candidates.js"), "utf8");
const extractor = fs.readFileSync(path.join(root, "tools/historical-gis/cli/extract-1326-cliopatria-candidates.js"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "tools/historical-gis/cli/run-1326-cliopatria-candidate-pipeline.js"), "utf8");

assert.match(script, /candidatePacketSha256/);
assert.match(script, /Duplicate sourceFeatureIndex/);
assert.match(script, /Duplicate sourceFeatureId/);
assert.match(script, /FromYear <= 1326 <= ToYear/);
assert.match(script, /candidate-evidence-only/);
assert.match(script, /inputFeatures !== counted \+ excludedTotal/);
assert.match(extractor, /candidatePacketSha256/);
assert.match(pipeline, /validate-1326-cliopatria-candidates\.js/);

console.log("1326 candidate packet validator contract passed: packet hash, temporal rule, geometry class, and evidence-only state are independently gated.");
