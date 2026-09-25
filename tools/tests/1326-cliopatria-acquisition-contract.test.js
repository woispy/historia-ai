import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(
  path.join(root, "data/gis/1326/acquisition-manifest.json"),
  "utf8",
));
const preflight = fs.readFileSync(
  path.join(root, "tools/historical-gis/cli/validate-1326-cliopatria-acquisition-ready.js"),
  "utf8",
);
const script = fs.readFileSync(
  path.join(root, "tools/historical-gis/cli/acquire-1326-cliopatria.js"),
  "utf8",
);

const source = manifest.sources.find(item => item.id === "cliopatria-v0.2.0");
assert.ok(source, "Cliopatria source must exist in the 1326 acquisition manifest.");

const expectedUrl = "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip";
const expectedSourceId = "cliopatria-v0.2.0";
const expectedBlobSha = source.snapshot?.immutableReference?.sourceBlobSha;

assert.ok(["acquisition-required", "acquired"].includes(source.status), "Cliopatria source status must remain acquisition-state controlled.");
assert.ok(source.status === "acquisition-required" || /^[0-9a-f]{64}$/.test(source.snapshot?.rawSha256 ?? ""), "Acquired Cliopatria snapshot must carry a raw SHA-256.");
assert.ok(["reference-pinned-not-acquired", "acquired"].includes(source.snapshot?.status), "Cliopatria snapshot status must remain acquisition-state controlled.");
assert.equal(source.url, "https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.0");
assert.ok(preflight.includes('source.snapshot.sourceFile !== "cliopatria.geojson.zip"'), "Acquisition preflight must pin the source file name.");
assert.match(expectedBlobSha ?? "", /^[0-9a-f]{40}$/);

assert.ok(preflight.includes('source.snapshot.immutableReference.sha !== "ad28a69"'), "Acquisition preflight must pin the immutable commit.");\nassert.ok(preflight.includes('source.snapshot.immutableReference.sourceBlobSha !== "cefab0f4b622e2e7fb3daf68d4f461f83991204c"'), "Acquisition preflight must pin the source blob SHA.");\n\nassert.ok(script.includes(`const SOURCE_URL = "${expectedUrl}";`), "Acquisition script URL drifted from the pinned v0.2.0 source.");
assert.ok(script.includes(`const SOURCE_ID = "${expectedSourceId}";`), "Acquisition script source ID drifted.");
assert.ok(script.includes(`const SOURCE_BLOB_SHA = "${expectedBlobSha}";`), "Acquisition script immutable source blob SHA drifted.");
assert.ok(script.includes('const ACQUISITION_MANIFEST = path.resolve("data/gis/1326/acquisition-manifest.json");'), "Acquisition must update the tracked 1326 acquisition manifest.");
assert.ok(script.includes('source.status = "acquired";'), "Successful acquisition must promote the source record from acquisition-required to acquired.");
assert.ok(script.includes('rawSha256: record.rawSha256'), "Successful acquisition must persist the retained artifact SHA-256 in the acquisition manifest.");
assert.ok(script.includes('source.snapshot?.rawSha256 !== record.rawSha256'), "Verification must cross-check the tracked manifest SHA-256.");
assert.ok(script.includes('source.snapshot?.immutableReference?.sha !== record.immutableReference?.sha'), "Verification must cross-check the immutable commit reference.");
assert.ok(script.includes('source.snapshot?.immutableReference?.sourceBlobSha !== record.immutableReference?.sourceBlobSha'), "Verification must cross-check the immutable source blob SHA.");
assert.ok(script.includes('source.snapshot?.retainedArtifact !== record.retainedArtifact'), "Verification must cross-check the retained artifact path.");
assert.ok(script.includes('record.sourceUrl !== SOURCE_URL'), "Verification must cross-check the pinned source URL.");
assert.ok(script.includes('promotion: "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW"'), "Acquisition must remain promotion-blocked.");

console.log("1326 Cliopatria acquisition contract passed: manifest/script provenance is aligned and acquisition remains blocked until verification.");
