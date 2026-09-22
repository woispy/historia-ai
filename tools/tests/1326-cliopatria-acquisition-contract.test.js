import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(
  path.join(root, "data/gis/1326/acquisition-manifest.json"),
  "utf8",
));
const script = fs.readFileSync(
  path.join(root, "tools/historical-gis/cli/acquire-1326-cliopatria.js"),
  "utf8",
);

const source = manifest.sources.find(item => item.id === "cliopatria-v0.2.0");
assert.ok(source, "Cliopatria source must exist in the 1326 acquisition manifest.");

const expectedUrl = "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip";
const expectedSourceId = "cliopatria-v0.2.0";
const expectedBlobSha = source.snapshot?.immutableReference?.sourceBlobSha;

assert.equal(source.status, "acquisition-required");
assert.equal(source.snapshot?.status, "reference-pinned-not-acquired");
assert.equal(source.url, "https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.0");
assert.match(expectedBlobSha ?? "", /^[0-9a-f]{40}$/);

assert.ok(script.includes(`const SOURCE_URL = "${expectedUrl}";`), "Acquisition script URL drifted from the pinned v0.2.0 source.");
assert.ok(script.includes(`const SOURCE_ID = "${expectedSourceId}";`), "Acquisition script source ID drifted.");
assert.ok(script.includes(`const SOURCE_BLOB_SHA = "${expectedBlobSha}";`), "Acquisition script immutable source blob SHA drifted.");
assert.ok(script.includes('promotion: "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW"'), "Acquisition must remain promotion-blocked.");

console.log("1326 Cliopatria acquisition contract passed: manifest/script provenance is aligned and acquisition remains blocked until verification.");
