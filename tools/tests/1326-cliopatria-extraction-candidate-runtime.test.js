import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-extraction-candidate-"));
const extractor = path.join(root, "tools/historical-gis/cli/extract-1326-cliopatria-candidates.js");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

const geojson = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    id: "pilot-1",
    properties: { Name: "Pilot Polity", FromYear: 1200, ToYear: 1400, Type: "POLITY" },
    geometry: { type: "Polygon", coordinates: [[[29,40],[29.1,40],[29.1,40.1],[29,40.1],[29,40]]] }
  }]
};
const geojsonRaw = JSON.stringify(geojson);
const extractedPath = path.join(temp, "cliopatria.geojson");
await fs.writeFile(extractedPath, geojsonRaw);
const extractionInputPath = path.join(temp, "extraction-input.json");
await fs.writeFile(extractionInputPath, JSON.stringify({
  schemaVersion: 1,
  sourceId: "cliopatria-v0.2.0",
  scenarioDate: "1326-04-07",
  archive: { path: "archive.zip", rawSha256: "a".repeat(64), byteLength: 1, acquisitionRecord: "acquisition.json" },
  member: { path: "cliopatria.geojson", extractedPath: extractedPath, sha256: sha256(Buffer.from(geojsonRaw)), format: "GeoJSON", featureCollectionValidated: true },
  immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
  extractionPolicy: "Exactly one .geojson archive member; cross-platform extraction; no inferred member selection.",
  promotion: "BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW"
}));

async function run(name, success) {
  const output = path.join(temp, name + ".json");
  const result = await new Promise(resolve => {
    const child = spawn(process.execPath, [extractor, "--extraction-input", extractionInputPath, "--output", output], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stderr }));
  });
  assert.equal(result.code === 0, success, result.stderr);
}

await run("baseline", true);
const mutated = JSON.parse(await fs.readFile(extractionInputPath, "utf8"));
mutated.member.sha256 = "b".repeat(64);
await fs.writeFile(extractionInputPath, JSON.stringify(mutated));
await run("tampered-hash", false);
mutated.member.sha256 = sha256(Buffer.from(geojsonRaw));
await fs.writeFile(extractionInputPath, JSON.stringify(mutated));
await fs.writeFile(extractedPath, geojsonRaw.replace("Pilot Polity", "Mutated Polity"));
await run("tampered-bytes", false);

console.log("1326 extraction-to-candidate runtime integrity contract passed.");
