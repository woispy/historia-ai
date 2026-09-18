import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SOURCE_URL = "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip";
const SOURCE_ID = "cliopatria-v0.2.0";
const SOURCE_BLOB_SHA = "cefab0f4b622e2e7fb3daf68d4f461f83991204c";
const OUTPUT_DIR = path.resolve("data/build/gis/1326/source-snapshots");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "cliopatria-v0.2.0.geojson.zip");
const RECORD_MANIFEST = path.join(OUTPUT_DIR, "cliopatria-v0.2.0.acquisition.json");

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return { download: args.has("--download"), verify: args.has("--verify") };
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertZip(bytes) {
  if (bytes.length < 4) throw new Error("Cliopatria payload is empty/truncated.");
  const signature = bytes.subarray(0, 4);
  const valid = signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    || signature.equals(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
    || signature.equals(Buffer.from([0x50, 0x4b, 0x07, 0x08]));
  if (!valid) throw new Error("Cliopatria payload does not have a ZIP signature.");
}

async function acquire() {
  const response = await fetch(SOURCE_URL, { redirect: "follow" });
  if (!response.ok) throw new Error(`Cliopatria download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assertZip(bytes);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, bytes);
  const record = {
    schemaVersion: 1,
    sourceId: SOURCE_ID,
    sourceTag: "v0.2.0",
    immutableReference: {
      type: "git-commit",
      sha: "ad28a69",
      sourceBlobSha: SOURCE_BLOB_SHA
    },
    sourceUrl: SOURCE_URL,
    acquiredAt: new Date().toISOString(),
    sourceFile: "cliopatria.geojson.zip",
    retainedArtifact: OUTPUT_FILE.replace(/\\/g, "/"),
    rawSha256: sha256(bytes),
    byteLength: bytes.length,
    binaryValidation: "ZIP signature verified",
    temporalExtraction: {
      scenarioDate: "1326-04-07",
      rule: "FromYear <= 1326 <= ToYear",
      status: "not-yet-extracted"
    },
    promotion: "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW"
  };
  await fs.writeFile(RECORD_MANIFEST, `${JSON.stringify(record, null, 2)}\\n`);
  console.log(JSON.stringify(record, null, 2));
}

async function verify() {
  const bytes = await fs.readFile(OUTPUT_FILE);
  assertZip(bytes);
  const record = JSON.parse(await fs.readFile(RECORD_MANIFEST, "utf8"));
  const actual = sha256(bytes);
  if (actual !== record.rawSha256) throw new Error(`SHA-256 mismatch: expected ${record.rawSha256}, got ${actual}`);
  if (bytes.length !== record.byteLength) throw new Error("Retained artifact byte length mismatch.");
  console.log(JSON.stringify({ sourceId: SOURCE_ID, verify: "PASS", rawSha256: actual, byteLength: bytes.length }, null, 2));
}

const { download, verify: doVerify } = parseArgs(process.argv);
if (!download && !doVerify) throw new Error("Use --download to acquire bytes or --verify to re-hash the retained artifact.");
(doVerify ? verify() : acquire()).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
