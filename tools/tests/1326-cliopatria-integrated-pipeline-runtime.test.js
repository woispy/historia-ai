import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-t3b-pipeline-"));
const prepare = path.join(root, "tools/historical-gis/cli/prepare-1326-cliopatria-extraction-input.js");
const pipeline = path.join(root, "tools/historical-gis/cli/run-1326-cliopatria-candidate-pipeline.js");
const anchors = path.join(root, "tools/tests/fixtures/1326-candidate-surface/anchors.json");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeStoredZip(filename, data) {
  const name = Buffer.from(filename, "utf8");
  const crc = crc32(data);
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  name.copy(local, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(0, 42);
  name.copy(central, 46);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([local, data, central, end]);
}

async function runNode(script, args, expectFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => {\n      if (expectFailure) {\n        if (code === 0) reject(new Error(`Expected ${script} to fail.`));\n        else resolve(stderr);\n      } else if (code === 0) resolve();\n      else reject(new Error(stderr || `${script} exited with code ${code}`));\n    });
  });
}

const geojson = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    id: "synthetic-pilot-polity",
    properties: { Name: "Pilot Polity", FromYear: 1200, ToYear: 1400, Type: "POLITY" },
    geometry: { type: "Polygon", coordinates: [[[29.00,40.18],[29.08,40.18],[29.08,40.25],[29.00,40.25],[29.00,40.18]]] }
  }]
};
const geojsonRaw = Buffer.from(JSON.stringify(geojson), "utf8");
const archiveBytes = makeStoredZip("cliopatria.geojson", geojsonRaw);
const archivePath = path.join(temp, "cliopatria-v0.2.0.geojson.zip");
await fs.writeFile(archivePath, archiveBytes);

const relativeArchive = path.relative(root, archivePath).replace(/\\/g, "/");
const archiveSha = sha256(archiveBytes);
const acquiredAt = "2026-09-25T00:00:00.000Z";
const acquisition = {
  schemaVersion: 1,
  sourceId: "cliopatria-v0.2.0",
  sourceTag: "v0.2.0",
  immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
  sourceUrl: "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip",
  acquiredAt,
  sourceFile: "cliopatria.geojson.zip",
  retainedArtifact: relativeArchive,
  rawSha256: archiveSha,
  byteLength: archiveBytes.length,
  binaryValidation: "ZIP signature verified",
  promotion: "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW"
};
const acquisitionPath = path.join(temp, "acquisition.json");
await fs.writeFile(acquisitionPath, JSON.stringify(acquisition, null, 2));

const manifest = {
  scenarioDate: "1326-04-07",
  sources: [{
    id: "cliopatria-v0.2.0",
    status: "acquired",
    url: "https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.0",
    snapshot: {
      status: "acquired",
      sourceTag: "v0.2.0",
      immutableReference: acquisition.immutableReference,
      rawSha256: archiveSha,
      byteLength: archiveBytes.length,
      acquiredAt,
      retainedArtifact: relativeArchive
    }
  }]
};
const manifestPath = path.join(temp, "acquisition-manifest.json");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

const extractionInputPath = path.join(temp, "extraction-input.json");
try {
  await runNode(prepare, [
    "--archive", archivePath,
    "--acquisition", acquisitionPath,
    "--manifest", manifestPath,
    "--output", extractionInputPath,
    "--extract-dir", path.join(temp, "extracted-cliopatria")
  ]);

  const outputDir = path.join(temp, "pipeline-output");
  await runNode(pipeline, [
    "--extraction-input", extractionInputPath,
    "--anchors", anchors,
    "--output-dir", outputDir
  ]);

  const candidates = JSON.parse(await fs.readFile(path.join(outputDir, "cliopatria-1326-candidates.json"), "utf8"));
  const queue = JSON.parse(await fs.readFile(path.join(outputDir, "1326-geometry-reconciliation-queue.json"), "utf8"));
  assert.equal(candidates.counts.candidates, 1);
  assert.equal(queue.reviewQueue.length, 1);
  assert.equal(queue.promotion, "BLOCKED");
  assert.equal(queue.candidatePacketSha256, candidates.candidatePacketSha256);
  assert.equal(queue.reviewQueue[0].reviewStatus, "pending");
  assert.equal(queue.reviewQueue[0].reviewedGeometry, null);\n\n  const extractionRecord = JSON.parse(await fs.readFile(extractionInputPath, "utf8"));\n  extractionRecord.member.sha256 = "0".repeat(64);\n  const tamperedExtractionPath = path.join(temp, "tampered-extraction-input.json");\n  await fs.writeFile(tamperedExtractionPath, JSON.stringify(extractionRecord, null, 2));\n  await runNode(pipeline, [\n    "--extraction-input", tamperedExtractionPath,\n    "--anchors", anchors,\n    "--output-dir", path.join(temp, "tampered-pipeline-output")\n  ], true);\n\n  const tamperedCandidate = JSON.parse(JSON.stringify(candidates));\n  tamperedCandidate.candidates[0].name = "Tampered Candidate";\n  const tamperedCandidatePath = path.join(temp, "tampered-candidates.json");\n  await fs.writeFile(tamperedCandidatePath, JSON.stringify(tamperedCandidate, null, 2));\n  const operationalState = path.join(root, "tools/historical-gis/cli/validate-1326-cliopatria-operational-state.js");\n  await runNode(operationalState, [\n    "--manifest", manifestPath,\n    "--acquisition", acquisitionPath,\n    "--extraction-input", extractionInputPath,\n    "--candidates", tamperedCandidatePath,\n    "--require-candidate-ready", "true"\n  ], true);\n\n  console.log("1326 integrated acquisition-to-T3-B runtime contract passed.");
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
