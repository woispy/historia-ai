import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const root = process.cwd();
const stateGate = path.join(root, "tools/historical-gis/cli/validate-1326-cliopatria-operational-state.js");
const prepare = path.join(root, "tools/historical-gis/cli/prepare-1326-cliopatria-extraction-input.js");
const pipeline = path.join(root, "tools/historical-gis/cli/run-1326-cliopatria-candidate-pipeline.js");
const anchors = path.join(root, "tools/tests/fixtures/1326-candidate-surface/anchors.json");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-state-gate-"));
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function runNode(script, args, expectFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (expectFailure) {
        if (code === 0) reject(new Error(`Expected failure from ${script}`));
        else resolve(stderr);
      } else if (code === 0) resolve();
      else reject(new Error(stderr || `${script} exited with code ${code}`));
    });
  });
}

const pinnedManifest = path.join(root, "data/gis/1326/acquisition-manifest.json");
await runNode(stateGate, ["--manifest", pinnedManifest]);
await runNode(stateGate, ["--manifest", pinnedManifest, "--extraction-input", path.join(temp, "forbidden.json")], true);

const geojson = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    id: "state-gate-pilot",
    properties: { Name: "State Gate Pilot", FromYear: 1200, ToYear: 1400, Type: "POLITY" },
    geometry: { type: "Polygon", coordinates: [[[29.00,40.18],[29.08,40.18],[29.08,40.25],[29.00,40.25],[29.00,40.18]]] }
  }]
};
const geojsonRaw = Buffer.from(JSON.stringify(geojson), "utf8");
const archivePath = path.join(temp, "cliopatria.geojson.zip");
const zip = Buffer.concat([
  Buffer.from([0x50,0x4b,0x03,0x04,0x14,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]),
  geojsonRaw
]);
await fs.writeFile(archivePath, zip);
const archiveSha = sha256(zip);
const relativeArchive = path.relative(root, archivePath).replace(/\\/g, "/");
const acquisition = {
  schemaVersion: 1,
  sourceId: "cliopatria-v0.2.0",
  sourceTag: "v0.2.0",
  immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
  sourceUrl: "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip",
  acquiredAt: "2026-09-25T00:00:00.000Z",
  sourceFile: "cliopatria.geojson.zip",
  retainedArtifact: relativeArchive,
  rawSha256: archiveSha,
  byteLength: zip.length,
  promotion: "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW"
};
const acquisitionPath = path.join(temp, "acquisition.json");
await fs.writeFile(acquisitionPath, JSON.stringify(acquisition, null, 2));
const manifest = {
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  sources: [{
    id: "cliopatria-v0.2.0",
    status: "acquired",
    snapshot: {
      status: "acquired",
      sourceTag: "v0.2.0",
      immutableReference: acquisition.immutableReference,
      sourceFile: "cliopatria.geojson.zip",
      rawSha256: archiveSha,
      byteLength: zip.length,
      acquiredAt: acquisition.acquiredAt,
      retainedArtifact: relativeArchive
    }
  }]
};
const manifestPath = path.join(temp, "manifest.json");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

try {
  await runNode(stateGate, ["--manifest", manifestPath]);
  await runNode(stateGate, ["--manifest", manifestPath, "--acquisition", acquisitionPath]);

  const extractionInputPath = path.join(temp, "extraction-input.json");
  await runNode(prepare, [
    "--archive", archivePath,
    "--acquisition", acquisitionPath,
    "--manifest", manifestPath,
    "--output", extractionInputPath,
    "--extract-dir", path.join(temp, "extracted")
  ]);
  await runNode(stateGate, ["--manifest", manifestPath, "--acquisition", acquisitionPath, "--extraction-input", extractionInputPath]);

  const outputDir = path.join(temp, "pipeline-output");
  await runNode(pipeline, ["--extraction-input", extractionInputPath, "--anchors", anchors, "--output-dir", outputDir]);
  const candidatesPath = path.join(outputDir, "cliopatria-1326-candidates.json");
  await runNode(stateGate, ["--manifest", manifestPath, "--acquisition", acquisitionPath, "--extraction-input", extractionInputPath, "--candidates", candidatesPath]);

  await runNode(stateGate, ["--manifest", manifestPath, "--extraction-input", extractionInputPath], true);
  await runNode(stateGate, ["--manifest", manifestPath, "--acquisition", acquisitionPath, "--candidates", candidatesPath], true);

  console.log("1326 operational state transition contract passed.");
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
