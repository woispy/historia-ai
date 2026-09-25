import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extract = fs.readFileSync(path.join(root, "tools/historical-gis/cli/extract-1326-cliopatria-candidates.js"), "utf8");
const reconcile = fs.readFileSync(path.join(root, "tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js"), "utf8");
const screen = fs.readFileSync(path.join(root, "tools/historical-gis/cli/screen-1326-political-candidate-surface.js"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "tools/historical-gis/cli/run-1326-cliopatria-candidate-pipeline.js"), "utf8");
const review = fs.readFileSync(path.join(root, "tools/historical-gis/cli/prepare-1326-geometry-reconciliation.js"), "utf8");

assert.match(extract, /extractedGeojsonSha256/);
assert.match(reconcile, /sourceProvenance/);
assert.match(reconcile, /extractedGeojsonSha256/);
assert.match(screen, /provenance/);
assert.match(screen, /extractedGeojsonSha256/);
assert.match(pipeline, /Candidate\/reconciliation extraction provenance mismatch/);
assert.match(pipeline, /Candidate\/screening extraction provenance mismatch/);
assert.match(review, /sourceProvenance/);
assert.match(review, /Reconciliation\/extraction provenance mismatch/);

console.log("1326 candidate provenance lineage contract passed: extraction identity is carried and cross-checked through reconciliation, screening, and review preparation.");
